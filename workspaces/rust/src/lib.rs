mod algorithm;
mod dither;
mod enhance;
mod litematic;
mod palette;

use std::cell::RefCell;
use std::collections::hash_map::DefaultHasher;
use std::collections::HashMap;
use std::hash::{Hash, Hasher};
use std::io::Cursor;

use image::imageops::FilterType;
use image::{DynamicImage, RgbImage};
use js_sys::{Array, Object, Reflect, Uint8Array};
use wasm_bindgen::prelude::*;

use palette::BlockDef;

/// WASM 模块加载完成后立即执行：安装 panic hook，把 Rust 侧的 panic 信息
/// 打印到浏览器控制台，便于调试。
#[wasm_bindgen(start)]
pub fn start() {
    console_error_panic_hook::set_once();
}

/// 将图片字节缩放到指定宽高，并以 PNG 字节返回。
#[wasm_bindgen]
pub fn resize_image(data: Vec<u8>, width: u32, height: u32) -> Vec<u8> {
    let image = image::load_from_memory(&data).expect("resize_image: 无法解码图片字节");

    // FilterType::Nearest -> 硬边缘
    // FilterType::Lanczos3 -> 软边缘
    let resized = image.resize_exact(width, height, FilterType::Lanczos3);

    let mut buffer = Cursor::new(Vec::new());
    resized
        .write_to(&mut buffer, image::ImageFormat::Png)
        .expect("resize_image: 无法将缩放结果编码为 PNG");

    buffer.into_inner()
}

/// 把图片缩放到指定宽高，再量化成候选方块颜色，返回按行优先排列的 RGB 颜色。
fn to_block_colors(
    data: &[u8],
    width: u32,
    height: u32,
    dither: &str,
    algorithm: &str,
    enhance: u8,
    palette: &[BlockDef],
) -> Vec<[u8; 3]> {
    let image = image::load_from_memory(data).expect("无法解码图片字节");
    let resized = image.resize_exact(width, height, FilterType::Nearest);
    let rgb = resized.to_rgb8();

    let w = width as usize;
    let h = height as usize;

    let mut buf: Vec<f32> = Vec::with_capacity(w * h * 3);
    for p in rgb.pixels() {
        buf.push(p[0] as f32);
        buf.push(p[1] as f32);
        buf.push(p[2] as f32);
    }

    enhance::apply(&mut buf, enhance as f32 / 100.0);

    let distance = algorithm::resolve(algorithm);
    let ditherer = dither::resolve(dither);
    dither::apply(
        &mut buf,
        w,
        h,
        distance.as_ref(),
        ditherer.as_ref(),
        palette,
    );

    let mut colors = Vec::with_capacity(w * h);
    for i in 0..(w * h) {
        colors.push([buf[i * 3] as u8, buf[i * 3 + 1] as u8, buf[i * 3 + 2] as u8]);
    }
    colors
}

// mapart 与 export_litematic 共用同一份 pal + colors，避免同一张图被量化两次。
// prepare 计算并缓存；若输入与缓存一致则跳过耗时步骤，直接复用。

/// 计算图片字节的 64 位哈希，用于 prepare 的缓存命中判断（避免逐字节比较整张图）。
fn data_hash(data: &[u8]) -> u64 {
    let mut hasher = DefaultHasher::new();
    data.hash(&mut hasher);
    hasher.finish()
}

struct Prepared {
    pal: Vec<BlockDef>,
    colors: Vec<[u8; 3]>,
    width: u32,
    height: u32,
    data_hash: u64,
    dither: String,
    algorithm: String,
    enhance: u8,
    blocks: Vec<String>,
}

thread_local! {
    static PREPARED: RefCell<Option<Prepared>> = RefCell::new(None);
}

/// 预计算调色板和量化颜色并缓存，供 mapart / export_litematic 共用。
///
/// 输入与缓存完全一致（图片哈希 + 宽高 + 抖动 + 算法 + 增强 + 方块列表）时
/// 直接复用，跳过 build_palette + to_block_colors 这两步最耗时的运算。
#[wasm_bindgen]
pub fn prepare(
    data: Vec<u8>,
    width: u32,
    height: u32,
    dither: String,
    algorithm: String,
    enhance: u8,
    blocks: Vec<String>,
) {
    let hash = data_hash(&data);

    PREPARED.with(|cell| {
        let hit = cell.borrow().as_ref().is_some_and(|c| {
            c.width == width
                && c.height == height
                && c.enhance == enhance
                && c.dither == dither
                && c.algorithm == algorithm
                && c.blocks == blocks
                && c.data_hash == hash
        });
        if hit {
            return;
        }

        let pal = palette::build_palette(&blocks);
        let colors = to_block_colors(&data, width, height, &dither, &algorithm, enhance, &pal);

        *cell.borrow_mut() = Some(Prepared {
            pal,
            colors,
            width,
            height,
            data_hash: hash,
            dither,
            algorithm,
            enhance,
            blocks,
        });
    });
}

/// 清除 prepare 缓存。下次调用 mapart / export_litematic 前需要重新 prepare。
#[wasm_bindgen]
pub fn invalidate() {
    PREPARED.with(|cell| {
        *cell.borrow_mut() = None;
    });
}

/// 在 JS object 上写入一个属性；仅用于构造返回值，Reflect::set 不会失败，故忽略返回。
fn set(obj: &Object, key: &str, value: &JsValue) {
    let _ = Reflect::set(obj.as_ref(), &JsValue::from(key), value);
}

/// 把图片缩放到指定宽高，再把每个像素替换成最接近的候选方块颜色（地图画）。
/// 量化用 normal 颜色；输出的预览 PNG 改用对应的 high 颜色，亮度更接近游戏内观感。
///
/// 依赖 prepare 预先缓存的 pal + colors；未调用 prepare 时会 panic。
///
/// 返回 JS 对象 `{ png: Uint8Array, blocks: [{ name_eng, length }, ...] }`：
/// blocks 为实际使用方块的统计（按数量降序，length 为该方块占用的像素数）。
#[wasm_bindgen]
pub fn mapart() -> JsValue {
    PREPARED.with(|cell| {
        let borrow = cell.borrow();
        let prep = borrow.as_ref().expect("mapart: 请先调用 prepare");

        let pal = &prep.pal;
        let colors = &prep.colors;
        let width = prep.width;
        let height = prep.height;

        // 统计每种方块的使用数量：按 name_eng 聚合（取调色板中靠前的匹配项，
        // 与 high_of / block_id_of 的选取一致）。
        let mut counts: HashMap<&'static str, u32> = HashMap::new();
        for c in colors {
            *counts.entry(palette::name_eng_of(c, pal)).or_insert(0) += 1;
        }

        // 预览 PNG 用 high 颜色输出（更接近游戏内高亮度观感）；
        // 量化 / 抖动仍用 normal，litematic 导出也仍用 normal → 方块 ID 不受影响。
        let mut out = Vec::with_capacity(colors.len() * 3);
        for c in colors {
            out.extend_from_slice(&palette::high_of(c, pal));
        }
        let out_img = RgbImage::from_raw(width, height, out).expect("mapart: 输出尺寸不一致");

        let mut buffer = Cursor::new(Vec::new());
        DynamicImage::ImageRgb8(out_img)
            .write_to(&mut buffer, image::ImageFormat::Png)
            .expect("mapart: 无法编码 PNG");
        let png = buffer.into_inner();

        // 数量降序；同数量按 name_eng 升序，保证结果稳定可复现。
        let mut stats: Vec<(&'static str, u32)> = counts.into_iter().collect();
        stats.sort_by(|a, b| b.1.cmp(&a.1).then_with(|| a.0.cmp(b.0)));

        let blocks_arr = Array::new();
        for (name_eng, length) in stats {
            let entry = Object::new();
            set(&entry, "name_eng", &JsValue::from(name_eng));
            set(&entry, "length", &JsValue::from(f64::from(length)));
            blocks_arr.push(entry.as_ref());
        }

        let png_arr = Uint8Array::new_with_length(png.len() as u32);
        png_arr.copy_from(&png);

        let result = Object::new();
        set(&result, "png", png_arr.as_ref());
        set(&result, "blocks", blocks_arr.as_ref());
        result.into()
    })
}

/// 导出 Litematica 投影。
/// - slice = false：返回单个 .litematic（gzip 压缩的 NBT）。
/// - slice = true ：按 128×128 切片，返回一个 ZIP（内含 N 个 .litematic）。
///
/// 依赖 prepare 预先缓存的 pal + colors；未调用 prepare 时会 panic。
#[wasm_bindgen]
pub fn export_litematic(slice: bool) -> Vec<u8> {
    PREPARED.with(|cell| {
        let borrow = cell.borrow();
        let prep = borrow.as_ref().expect("export_litematic: 请先调用 prepare");

        let pal = &prep.pal;
        let colors = &prep.colors;
        let w = prep.width as usize;
        let h = prep.height as usize;

        if !slice {
            return litematic::build_projection("Map", colors, pal, w, h);
        }

        // width / height 一定是 128 的倍数（前端在 x1 模式会先取整到 128 的倍数，
        // x128 模式则直接是 128 的整数倍）。
        let cols = w / 128;
        let rows = h / 128;
        let mut files: Vec<(String, Vec<u8>)> = Vec::with_capacity(cols * rows);

        // 文件名按总切片数的位数补零：如 3 位 → 001、010、100
        let digits = (cols * rows).to_string().len();

        let mut idx = 1usize;
        for r in 0..rows {
            for c in 0..cols {
                let mut sub = Vec::with_capacity(128 * 128);
                for y in 0..128 {
                    for x in 0..128 {
                        let gx = c * 128 + x;
                        let gy = r * 128 + y;
                        sub.push(colors[gy * w + gx]);
                    }
                }

                let idx_str = format!("{:0width$}", idx, width = digits);
                let name = format!("Map-{}", idx_str);
                let bytes = litematic::build_projection(&name, &sub, pal, 128, 128);
                files.push((format!("{}.litematic", idx_str), bytes));
                idx += 1;
            }
        }

        litematic::build_zip(&files)
    })
}

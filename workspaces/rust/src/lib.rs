mod algorithm;
mod dither;
mod enhance;
mod litematic;
mod palette;

use std::io::Cursor;

use image::imageops::FilterType;
use image::{DynamicImage, RgbImage};
use wasm_bindgen::prelude::*;

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

/// 把图片缩放到指定宽高，再量化成地毯颜色，返回按行优先排列的 RGB 颜色。
fn to_block_colors(
    data: &[u8],
    width: u32,
    height: u32,
    dither: &str,
    algorithm: &str,
    enhance: u8,
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
    dither::apply(&mut buf, w, h, distance.as_ref(), ditherer.as_ref());

    let mut colors = Vec::with_capacity(w * h);
    for i in 0..(w * h) {
        colors.push([buf[i * 3] as u8, buf[i * 3 + 1] as u8, buf[i * 3 + 2] as u8]);
    }
    colors
}

/// 把图片缩放到指定宽高，再把每个像素替换成最接近的地毯颜色（地图画）。
#[wasm_bindgen]
pub fn mapart(
    data: Vec<u8>,
    width: u32,
    height: u32,
    dither: String,
    algorithm: String,
    enhance: u8,
) -> Vec<u8> {
    let colors = to_block_colors(&data, width, height, &dither, &algorithm, enhance);

    let mut out = Vec::with_capacity(colors.len() * 3);
    for c in &colors {
        out.extend_from_slice(c);
    }
    let out_img = RgbImage::from_raw(width, height, out).expect("mapart: 输出尺寸不一致");

    let mut buffer = Cursor::new(Vec::new());
    DynamicImage::ImageRgb8(out_img)
        .write_to(&mut buffer, image::ImageFormat::Png)
        .expect("mapart: 无法编码 PNG");

    buffer.into_inner()
}

/// 导出 Litematica 投影。
/// - slice = false：返回单个 .litematic（gzip 压缩的 NBT）。
/// - slice = true ：按 128×128 切片，返回一个 ZIP（内含 N 个 .litematic）。
#[wasm_bindgen]
pub fn export_litematic(
    data: Vec<u8>,
    width: u32,
    height: u32,
    dither: String,
    algorithm: String,
    slice: bool,
    enhance: u8,
) -> Vec<u8> {
    let colors = to_block_colors(&data, width, height, &dither, &algorithm, enhance);
    let w = width as usize;
    let h = height as usize;

    if !slice {
        return litematic::build_projection("Map", &colors, w, h);
    }

    // width / height 一定是 128 的倍数（前端在 x1 模式会先取整到 128 的倍数，
    // x128 模式则直接是 128 的整数倍）。
    let cols = w / 128;
    let rows = h / 128;
    let mut files: Vec<(String, Vec<u8>)> = Vec::with_capacity(cols * rows);

    // 文件名按总切片数的位数补零：如 3 位 → 001、010、100
    let width = (cols * rows).to_string().len();

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

            let idx_str = format!("{:0width$}", idx, width = width);
            let name = format!("Map-{}", idx_str);
            let bytes = litematic::build_projection(&name, &sub, 128, 128);
            files.push((format!("{}.litematic", idx_str), bytes));
            idx += 1;
        }
    }

    litematic::build_zip(&files)
}

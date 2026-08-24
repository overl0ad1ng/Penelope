use crate::algorithm::ColorDistance;
use crate::palette::BlockDef;

/// 抖动算法的统一 trait：每种抖动算法一个独立实现。
pub trait Ditherer {
    /// 对一个像素做量化（含抖动），返回量化后方块的 normal 颜色。
    /// 有序抖动（Bayer）会用到 x/y 位置；误差扩散忽略位置，随后在 diffuse 里扩散误差。
    fn quantize(
        &self,
        color: &[f32; 3],
        x: usize,
        y: usize,
        distance: &dyn ColorDistance,
        palette: &[BlockDef],
    ) -> [u8; 3];

    /// 把量化误差扩散到邻近像素（仅误差扩散类算法需要，默认空操作）。
    /// reverse 表示当前行是否反向扫描（蛇形，奇数行从右到左）。
    fn diffuse(
        &self,
        buf: &mut [f32],
        width: usize,
        height: usize,
        x: usize,
        y: usize,
        reverse: bool,
        err: &[f32; 3],
    ) {
        let _ = (buf, width, height, x, y, reverse, err);
    }
}

mod atkinson;
mod bayer_4x4;
mod floyd_steinberg;

pub use atkinson::Atkinson;
pub use bayer_4x4::Bayer4x4;
pub use floyd_steinberg::FloydSteinberg;

/// 根据名称解析抖动算法，未知名称回退到 FloydSteinberg。
pub fn resolve(name: &str) -> Box<dyn Ditherer> {
    match name {
        "atkinson" => Box::new(Atkinson),
        "bayer-4x4" => Box::new(Bayer4x4),
        _ => Box::new(FloydSteinberg),
    }
}

pub(crate) fn clampf(v: f32) -> f32 {
    v.max(0.0).min(255.0)
}

/// 把误差累加到像素 (px, py)，越界则忽略。
pub(crate) fn add_error(
    buf: &mut [f32],
    width: usize,
    height: usize,
    px: i32,
    py: i32,
    e: &[f32; 3],
) {
    if px < 0 || py < 0 || px >= width as i32 || py >= height as i32 {
        return;
    }
    let j = (py as usize * width + px as usize) * 3;
    buf[j] = clampf(buf[j] + e[0]);
    buf[j + 1] = clampf(buf[j + 1] + e[1]);
    buf[j + 2] = clampf(buf[j + 2] + e[2]);
}

/// 共享的量化主循环（蛇形扫描：奇数行从右到左，略微减少规律性拖尾伪影）。
/// 有序抖动的 diffuse 为空操作，因此蛇形顺序只影响误差扩散。
pub fn apply(
    buf: &mut [f32],
    width: usize,
    height: usize,
    distance: &dyn ColorDistance,
    ditherer: &dyn Ditherer,
    palette: &[BlockDef],
) {
    for y in 0..height {
        let reverse = y % 2 == 1;
        for xi in 0..width {
            let x = if reverse { width - 1 - xi } else { xi };
            let i = (y * width + x) * 3;
            let old = [buf[i], buf[i + 1], buf[i + 2]];
            let new = ditherer.quantize(&old, x, y, distance, palette);

            buf[i] = new[0] as f32;
            buf[i + 1] = new[1] as f32;
            buf[i + 2] = new[2] as f32;

            let err = [
                old[0] - new[0] as f32,
                old[1] - new[1] as f32,
                old[2] - new[2] as f32,
            ];

            ditherer.diffuse(buf, width, height, x, y, reverse, &err);
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::palette::CARPETS;

    fn run_and_check(name: &str) {
        let distance = crate::algorithm::resolve("redmean");
        let ditherer = resolve(name);
        let (w, h) = (8usize, 8usize);
        let mut buf: Vec<f32> = Vec::with_capacity(w * h * 3);
        for _y in 0..h {
            for x in 0..w {
                let v = (x * 32) as f32;
                buf.push(v);
                buf.push(v);
                buf.push(v);
            }
        }
        apply(
            &mut buf,
            w,
            h,
            distance.as_ref(),
            ditherer.as_ref(),
            CARPETS,
        );
        for i in 0..(w * h) {
            let c = [buf[i * 3] as u8, buf[i * 3 + 1] as u8, buf[i * 3 + 2] as u8];
            assert!(
                CARPETS.iter().any(|b| b.normal == c),
                "{} 输出了非调色板颜色 {:?}",
                name,
                c
            );
        }
    }

    #[test]
    fn all_ditherers_output_palette_colors() {
        run_and_check("floyd-steinberg");
        run_and_check("atkinson");
        run_and_check("bayer-4x4");
    }
}

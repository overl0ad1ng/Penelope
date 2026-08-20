use crate::algorithm::ColorDistance;
use crate::palette::nearest_carpet;

use super::{add_error, Ditherer};

/// Atkinson 误差扩散（1/8 扩散到 6 个邻近像素）。
pub struct Atkinson;

impl Ditherer for Atkinson {
    fn quantize(
        &self,
        color: &[f32; 3],
        _x: usize,
        _y: usize,
        distance: &dyn ColorDistance,
    ) -> [u8; 3] {
        nearest_carpet(color, distance)
    }

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
        let step = if reverse { -1 } else { 1 };
        let e = [err[0] / 8.0, err[1] / 8.0, err[2] / 8.0];

        add_error(buf, width, height, x as i32 + step, y as i32, &e); // 扫描方向下一像素
        add_error(buf, width, height, x as i32 + 2 * step, y as i32, &e); // 扫描方向下下像素
        add_error(buf, width, height, x as i32 - step, y as i32 + 1, &e); // 下一行、扫描方向上一像素
        add_error(buf, width, height, x as i32, y as i32 + 1, &e); // 正下方
        add_error(buf, width, height, x as i32 + step, y as i32 + 1, &e); // 下一行、扫描方向下一像素
        add_error(buf, width, height, x as i32, y as i32 + 2, &e); // 下两行
    }
}
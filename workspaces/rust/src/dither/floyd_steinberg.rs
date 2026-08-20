use crate::algorithm::ColorDistance;
use crate::palette::nearest_carpet;

use super::{add_error, Ditherer};

/// Floyd–Steinberg 误差扩散（右 7/16、左下 3/16、下 5/16、右下 1/16）。
pub struct FloydSteinberg;

impl Ditherer for FloydSteinberg {
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

        // 7/16 -> 扫描方向下一像素
        let e = [err[0] * 7.0 / 16.0, err[1] * 7.0 / 16.0, err[2] * 7.0 / 16.0];
        add_error(buf, width, height, x as i32 + step, y as i32, &e);
        // 3/16 -> 下一行、扫描方向上一像素
        let e = [err[0] * 3.0 / 16.0, err[1] * 3.0 / 16.0, err[2] * 3.0 / 16.0];
        add_error(buf, width, height, x as i32 - step, y as i32 + 1, &e);
        // 5/16 -> 正下方
        let e = [err[0] * 5.0 / 16.0, err[1] * 5.0 / 16.0, err[2] * 5.0 / 16.0];
        add_error(buf, width, height, x as i32, y as i32 + 1, &e);
        // 1/16 -> 下一行、扫描方向下一像素
        let e = [err[0] / 16.0, err[1] / 16.0, err[2] / 16.0];
        add_error(buf, width, height, x as i32 + step, y as i32 + 1, &e);
    }
}
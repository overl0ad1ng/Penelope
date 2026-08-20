use crate::algorithm::ColorDistance;
use crate::palette::nearest_two_carpets;

use super::Ditherer;

/// 4×4 Bayer 有序抖动（双候选阈值法）。
///
/// 不再给 RGB 三通道加相同偏移（那只能沿灰度轴平移），而是：
/// 1. 取最近的两个候选地毯色 c1、c2；
/// 2. 计算原色在 c1→c2 连线方向上的插值比例 t = d1 / (d1 + d2)；
/// 3. 用 Bayer 阈值判断：t > threshold ? c2 : c1。
/// 这样抖动始终在两个真实候选色之间按比例切换，能处理色相方向的差异。
pub struct Bayer4x4;

const BAYER: [[f32; 4]; 4] = [
    [0.0, 8.0, 2.0, 10.0],
    [12.0, 4.0, 14.0, 6.0],
    [3.0, 11.0, 1.0, 9.0],
    [15.0, 7.0, 13.0, 5.0],
];

/// 归一化 Bayer 阈值，返回 [0, 1) 范围内的值。
fn bayer_threshold(x: usize, y: usize) -> f32 {
    (BAYER[y & 3][x & 3] + 0.5) / 16.0
}

impl Ditherer for Bayer4x4 {
    fn quantize(
        &self,
        color: &[f32; 3],
        x: usize,
        y: usize,
        distance: &dyn ColorDistance,
    ) -> [u8; 3] {
        let (c1, c2, d1, d2) = nearest_two_carpets(color, distance);
        let t_pixel = d1 / (d1 + d2);
        let threshold = bayer_threshold(x, y);

        if t_pixel > threshold {
            c2
        } else {
            c1
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::algorithm;
    use crate::palette::nearest_two_carpets;

    #[test]
    fn nearest_two_finds_two_closest_grays() {
        let distance = algorithm::resolve("redmean");
        // [151.5] 是 white(171) 与 light_gray(132) 的中点
        let (c1, c2, _, _) = nearest_two_carpets(&[151.5, 151.5, 151.5], distance.as_ref());
        assert!(
            (c1 == [171, 171, 171] && c2 == [132, 132, 132])
                || (c1 == [132, 132, 132] && c2 == [171, 171, 171])
        );
    }

    #[test]
    fn bayer_dithers_between_two_nearest_only() {
        let distance = algorithm::resolve("redmean");
        let bayer = Bayer4x4;
        let color = [151.5, 151.5, 151.5];
        let (c1, c2, _, _) = nearest_two_carpets(&color, distance.as_ref());

        let mut saw_c1 = false;
        let mut saw_c2 = false;
        for y in 0..4 {
            for x in 0..4 {
                let out = bayer.quantize(&color, x, y, distance.as_ref());
                assert!(out == c1 || out == c2, "Bayer 输出了非候选颜色 {:?}", out);
                if out == c1 {
                    saw_c1 = true;
                }
                if out == c2 {
                    saw_c2 = true;
                }
            }
        }
        assert!(saw_c1 && saw_c2, "中间色没有在两个候选间抖动");
    }
}
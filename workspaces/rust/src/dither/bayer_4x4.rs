use crate::algorithm::ColorDistance;
use crate::palette::{nearest_two, BlockDef};

use super::Ditherer;

/// 4×4 Bayer 有序抖动（双候选阈值法）。
///
/// 1. 取最近的两个候选色 c1、c2；
/// 2. 用原始 RGB 向量把原色投影到 c1→c2 线段上，得到插值比例 t（与具体距离度量无关，
///    避免不同距离算法对"是否该混合"给出不一致的判断）；
/// 3. 若 t 落在 [0, 1] 内（原色确实在两候选之间），按 t 和 Bayer 阈值抖动；
///    若 t 超出 [0, 1]（原色在调色板色域之外，比如背景比最亮的候选还亮），
///    说明"次近候选"只是数值上偶然第二小、并非真实的插值方向，此时应始终输出 c1，
///    不与一个色相无关的候选色混合，否则会造成大面积偏色。
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

/// 把原色投影到 c1→c2 线段上，返回插值比例 t（未裁剪，可能 < 0 或 > 1）。
/// t = 0 表示落在 c1 上，t = 1 表示落在 c2 上。
/// 用原始 RGB 向量计算，与外部传入的 distance（可能带权重）无关，
/// 因为"是否在两者之间"是几何事实，不该因距离度量换算法而改变判断。
fn project_t(color: &[f32; 3], c1: &[u8; 3], c2: &[u8; 3]) -> f32 {
    let v = [
        c2[0] as f32 - c1[0] as f32,
        c2[1] as f32 - c1[1] as f32,
        c2[2] as f32 - c1[2] as f32,
    ];
    let w = [
        color[0] - c1[0] as f32,
        color[1] - c1[1] as f32,
        color[2] - c1[2] as f32,
    ];

    let v_len_sq = v[0] * v[0] + v[1] * v[1] + v[2] * v[2];
    if v_len_sq <= f32::EPSILON {
        // c1 == c2（调色板仅 1 项或两项相同），避免除零
        return 0.0;
    }

    let dot = v[0] * w[0] + v[1] * w[1] + v[2] * w[2];
    dot / v_len_sq
}

impl Ditherer for Bayer4x4 {
    fn quantize(
        &self,
        color: &[f32; 3],
        x: usize,
        y: usize,
        distance: &dyn ColorDistance,
        palette: &[BlockDef],
    ) -> [u8; 3] {
        let (c1, c2, _d1, _d2) = nearest_two(color, distance, palette);

        let t = project_t(color, &c1, &c2);

        // 原色不在 c1→c2 线段之间（色域外，比如背景比调色板里最亮的颜色还亮/还暗），
        // 此时 c2 只是数值上偶然第二近，并非真实插值方向，不应参与混合。
        if !(0.0..=1.0).contains(&t) {
            return c1;
        }

        let threshold = bayer_threshold(x, y);
        if t > threshold {
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
    use crate::palette::{nearest_two, CARPETS};

    #[test]
    fn nearest_two_finds_two_closest_grays() {
        let distance = algorithm::resolve("redmean");
        // [151.5] 是 white(171) 与 light_gray(132) 的中点
        let (c1, c2, _, _) = nearest_two(&[151.5, 151.5, 151.5], distance.as_ref(), CARPETS);
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
        let (c1, c2, _, _) = nearest_two(&color, distance.as_ref(), CARPETS);

        let mut saw_c1 = false;
        let mut saw_c2 = false;
        for y in 0..4 {
            for x in 0..4 {
                let out = bayer.quantize(&color, x, y, distance.as_ref(), CARPETS);
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

    /// 回归测试：色域外的纯白像素（比最亮的候选 171 还亮）不应该和无关色混合，
    /// 应始终稳定输出最近的候选。
    #[test]
    fn out_of_gamut_bright_pixel_does_not_dither_with_unrelated_color() {
        let distance = algorithm::resolve("redmean");
        let bayer = Bayer4x4;
        let color = [255.0, 255.0, 255.0]; // 纯白，超出调色板最亮值 171
        let (c1, _c2, _, _) = nearest_two(&color, distance.as_ref(), CARPETS);

        for y in 0..4 {
            for x in 0..4 {
                let out = bayer.quantize(&color, x, y, distance.as_ref(), CARPETS);
                assert_eq!(
                    out, c1,
                    "色域外像素不应抖动出非最近色，x={x} y={y} 输出={out:?}"
                );
            }
        }
    }

    /// 同样的场景换 manhattan 距离，确认不同距离算法下行为一致（不再因权重不同而偏色）。
    #[test]
    fn out_of_gamut_consistent_across_distance_algorithms() {
        for name in [
            "redmean",
            "manhattan",
            "euclidean",
            "weighted-euclidean",
            "hsl-atkinson",
            "hsl-bayer",
        ] {
            let distance = algorithm::resolve(name);
            let bayer = Bayer4x4;
            let color = [255.0, 255.0, 255.0];
            let (c1, _c2, _, _) = nearest_two(&color, distance.as_ref(), CARPETS);

            for y in 0..4 {
                for x in 0..4 {
                    let out = bayer.quantize(&color, x, y, distance.as_ref(), CARPETS);
                    assert_eq!(
                        out, c1,
                        "[{name}] 色域外像素不应抖动，x={x} y={y} 输出={out:?}"
                    );
                }
            }
        }
    }
}

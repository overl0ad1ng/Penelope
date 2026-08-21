use super::ColorDistance;

// HSL 色相加权距离算法族。
//
// 纯 RGB 数值距离的共同盲区：只看数值差，不区分"色相是否相符"，导致饱和度较高、
// 但整体偏亮/偏暗的颜色（比如浅粉色 #F9B9DF）在数值上离白/灰更近，被错误匹配成灰阶。
// 这一族算法都改用未归一化的色度（chroma = max−min）衡量"有多彩"——
// HSL 饱和度公式在亮度接近 0/255 时会数学性爆炸（很淡的 #E6E6FA 算出 0.67），
// 色度不会在极亮/极暗端失真。
//
// 族内有两个版本，分别针对两类抖动的特性调参（都实测过效果）：
//
// - [`HslAtkinson`]（v2）：配 Atkinson / Floyd–Steinberg 等**误差扩散**抖动。
//   误差扩散会把量化过冲摊给邻居，所以单像素可以激进地偏向彩色地毯，
//   整体色相保留度最高。
// - [`HslBayer`]（v3）：配 4×4 Bayer 等**有序**抖动。有序抖动没有误差扩散兜底，
//   每个像素必须一次选对，所以用中性区门控压制米白/浅肤被饱和色劫持的问题。

fn chroma(r: f32, g: f32, b: f32) -> f32 {
    r.max(g).max(b) - r.min(g).min(b)
}

fn lightness(r: f32, g: f32, b: f32) -> f32 {
    (r.max(g).max(b) + r.min(g).min(b)) / 2.0
}

/// 仅在色度不为 0 时有意义；色度为 0 时返回值是任意的（不应被使用）。
fn hue_deg(r: f32, g: f32, b: f32) -> f32 {
    let max = r.max(g).max(b);
    let delta = max - r.min(g).min(b);
    if delta < 1e-6 {
        return 0.0;
    }
    if max == r {
        60.0 * (((g - b) / delta).rem_euclid(6.0))
    } else if max == g {
        60.0 * (((b - r) / delta) + 2.0)
    } else {
        60.0 * (((r - g) / delta) + 4.0)
    }
}

fn hue_diff(h1: f32, h2: f32) -> f32 {
    let d = (h1 - h2).abs() % 360.0;
    if d > 180.0 {
        360.0 - d
    } else {
        d
    }
}

/// v2：色相承诺强、配误差扩散抖动（Atkinson / Floyd–Steinberg）的版本。
///
/// 特点是色相权重下限 1.0（`hue_mult = 1 + 4w`）：只要输入带一点色度就全额比色相，
/// 灰色候选惩罚也重（191，≈90° 色相差），所以淡薰衣草、浅粉这类低色度颜色
/// 会被坚定地推向彩色地毯。单看某几个像素会偏（米白可能选粉红），
/// 但误差扩散会把过冲摊给邻居整体抹匀，成片的色相保留度是族里最好的。
pub struct HslAtkinson;

impl HslAtkinson {
    /// 色度低于此值视为"基本无色相可言"。
    const CHROMA_FLOOR: f32 = 8.0;
    /// 输入是彩色、候选却是灰色时的固定色相失配惩罚（灰色候选没有色相，不能免检）。
    const GRAY_CANDIDATE_PENALTY: f32 = 255.0 * 0.75;
}

impl ColorDistance for HslAtkinson {
    fn distance(&self, a: &[f32; 3], b: &[u8; 3]) -> f32 {
        let (br, bg, bb) = (b[0] as f32, b[1] as f32, b[2] as f32);

        let c1 = chroma(a[0], a[1], a[2]);
        let c2 = chroma(br, bg, bb);
        let dl = lightness(a[0], a[1], a[2]) - lightness(br, bg, bb);

        let (dh, chroma_weight) = if c1 < Self::CHROMA_FLOOR {
            // 输入本身接近灰色：不比色相，只看亮度/色度差
            (0.0, 0.0)
        } else if c2 < Self::CHROMA_FLOOR {
            // 输入是彩色，候选是灰色：固定失配惩罚，不能免检
            (Self::GRAY_CANDIDATE_PENALTY, c1 / 255.0)
        } else {
            let h1 = hue_deg(a[0], a[1], a[2]);
            let h2 = hue_deg(br, bg, bb);
            ((hue_diff(h1, h2) / 180.0) * 255.0, c1.min(c2) / 255.0)
        };

        let hue_mult = 1.0 + 4.0 * chroma_weight;
        let light_mult = 1.0 - 0.4 * chroma_weight;

        let wdh = hue_mult * dh;
        let wdl = light_mult * dl;
        let wdc = 0.3 * (c1 - c2);

        (wdh * wdh + wdl * wdl + wdc * wdc).sqrt()
    }
}

/// v3：中性区门控、配有序抖动（4×4 Bayer）的版本。
///
/// v2 配有序抖动时会"粉红劫持"：Bayer 没有误差扩散兜底，v2 的三个参数缺陷
/// 会被逐像素放大——
/// 1. 色相权重下限 1.0，色度只有 15 的米白（皮肤高光 #FFF8F0）也几乎全额比色相，
///    而粉红地毯亮度 175 恰好接近白色 171，"色相差 52°"压过白地毯；
/// 2. 灰色惩罚 191 把白/浅灰排除得太狠；
/// 3. 色度差权重 0.3 太弱，饱和候选（色度 99）抢淡色像素（色度 15）不用付代价。
///
/// v3 的修正：
/// 1. 中性区：输入色度低于 CHROMA_FLOOR 时完全不比色相，只按亮度/色度差，
///    米白、奶油色、阴影色度噪声都安心选灰阶；
/// 2. 色相权重从门限开始随色度平滑爬升（在门限处连续为 0，不会跳变），
///    到 HUE_RAMP 满格——输入越多彩，色相发言权越大；
/// 3. 灰色惩罚降到 70（≈25° 色相差的等价量）；
/// 4. 色度差权重提高到 0.5：饱和候选抢淡色像素要为过饱和付出明显代价。
pub struct HslBayer;

impl HslBayer {
    /// 输入色度低于此值视为"基本无色相可言"，只按亮度/色度比较。
    /// 取 24 而不是 v2 的 8：#E6E6FA(20)/#FFF8F0(15) 这类肉眼看是米白的颜色
    /// 都应该落在中性区；阴影里的色度噪声（通常 < 12）也不该触发色相比较。
    const CHROMA_FLOOR: f32 = 24.0;
    /// 色度超出门限多少后，色相权重到达满格。
    const HUE_RAMP: f32 = 40.0;
    /// 满格时的色相权重上限。
    const HUE_STRENGTH: f32 = 4.0;
    /// 输入是彩色、候选却是灰色时的固定色相失配惩罚（灰色候选没有色相，不能免检）。
    const GRAY_CANDIDATE_PENALTY: f32 = 70.0;
    /// 色度差的权重：惩罚"候选比输入饱和得多"的匹配。
    const CHROMA_DIFF_WEIGHT: f32 = 0.5;
}

impl ColorDistance for HslBayer {
    fn distance(&self, a: &[f32; 3], b: &[u8; 3]) -> f32 {
        let (br, bg, bb) = (b[0] as f32, b[1] as f32, b[2] as f32);

        let c1 = chroma(a[0], a[1], a[2]);
        let c2 = chroma(br, bg, bb);
        let dl = lightness(a[0], a[1], a[2]) - lightness(br, bg, bb);

        // 在门限处 hue_scale 恰好为 0，色相权重平滑接入，不会因跨过门限而跳变。
        let hue_scale = ((c1 - Self::CHROMA_FLOOR) / Self::HUE_RAMP).clamp(0.0, 1.0);
        let hue_mult = Self::HUE_STRENGTH * hue_scale;

        let dh = if hue_mult <= 0.0 {
            // 输入本身接近中性：不比色相
            0.0
        } else if c2 < Self::CHROMA_FLOOR {
            // 输入是彩色，候选是灰色：固定失配惩罚，不能免检
            Self::GRAY_CANDIDATE_PENALTY
        } else {
            let h1 = hue_deg(a[0], a[1], a[2]);
            let h2 = hue_deg(br, bg, bb);
            (hue_diff(h1, h2) / 180.0) * 255.0
        };

        let wdh = hue_mult * dh;
        let wdc = Self::CHROMA_DIFF_WEIGHT * (c1 - c2);

        (wdh * wdh + dl * dl + wdc * wdc).sqrt()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::palette::nearest_carpet;

    fn assert_nearest(
        distance: &dyn ColorDistance,
        r: u8,
        g: u8,
        b: u8,
        expected: [u8; 3],
    ) {
        let color = [r as f32, g as f32, b as f32];
        let nearest = nearest_carpet(&color, distance);
        assert_eq!(
            nearest, expected,
            "输入 ({r},{g},{b}) 期望匹配 {expected:?}，实际 {nearest:?}"
        );
    }

    // ---------- HslAtkinson（v2，配误差扩散抖动）----------

    #[test]
    fn atkinson_saturated_pale_pink_prefers_pink_carpet() {
        assert_nearest(&HslAtkinson, 0xF9, 0xB9, 0xDF, [208, 109, 142]);
    }

    #[test]
    fn atkinson_near_gray_prefers_white_not_pulled_by_hue() {
        assert_nearest(&HslAtkinson, 0xC7, 0xC9, 0xC8, [171, 171, 171]);
    }

    /// v2 的招牌行为：淡薰衣草（色度 20）坚定选彩色地毯而非白。
    /// HSL 饱和度公式在这个颜色上会虚高到 0.67，但色度只有 20，
    /// 用色度判"有多彩"不会爆炸。
    #[test]
    fn atkinson_pale_lavender_prefers_colored_carpet() {
        assert_nearest(&HslAtkinson, 0xE6, 0xE6, 0xFA, [88, 132, 186]); // -> light_blue
    }

    #[test]
    fn atkinson_pure_gray_matches_exactly() {
        assert_nearest(&HslAtkinson, 132, 132, 132, [132, 132, 132]);
    }

    #[test]
    fn atkinson_pure_red_matches_red_carpet() {
        assert_nearest(&HslAtkinson, 255, 0, 0, [132, 44, 44]);
    }

    #[test]
    fn atkinson_mid_gray_not_pulled_to_saturated_candidate() {
        assert_nearest(&HslAtkinson, 128, 128, 128, [132, 132, 132]);
    }

    // ---------- HslBayer（v3，配有序抖动）----------

    #[test]
    fn bayer_saturated_pale_pink_prefers_pink_carpet() {
        assert_nearest(&HslBayer, 0xF9, 0xB9, 0xDF, [208, 109, 142]);
    }

    #[test]
    fn bayer_near_gray_prefers_white_not_pulled_by_hue() {
        assert_nearest(&HslBayer, 0xC7, 0xC9, 0xC8, [171, 171, 171]);
    }

    /// 薰衣草色 #E6E6FA 的色度只有 20（落在中性区），肉眼看是米白偏冷，
    /// 应选白地毯而不是被色相拖去彩色地毯。
    #[test]
    fn bayer_pale_lavender_counts_as_neutral_prefers_white() {
        assert_nearest(&HslBayer, 0xE6, 0xE6, 0xFA, [171, 171, 171]);
    }

    /// 回归测试：米白色（皮肤高光）绝不能匹配饱和的粉红地毯。
    /// v2 因色相权重下限 1.0 + 灰色惩罚 191，这个颜色会被粉红劫持。
    #[test]
    fn bayer_cream_white_not_hijacked_by_pink() {
        assert_nearest(&HslBayer, 0xFF, 0xF8, 0xF0, [171, 171, 171]);
    }

    /// 回归测试：浅肤色/米白偏橙应保持暖色相（橙地毯），而不是被粉红抢走。
    #[test]
    fn bayer_pale_skin_tan_prefers_orange_not_pink() {
        assert_nearest(&HslBayer, 0xF4, 0xDD, 0xB2, [186, 109, 44]);
    }

    /// 回归测试：阴影里的色度噪声不应触发色相比较，避免黑发区域出棕色噪点。
    #[test]
    fn bayer_dark_noisy_pixel_stays_black() {
        assert_nearest(&HslBayer, 30, 25, 20, [21, 21, 21]);
    }

    /// 有明确彩色倾向的淡色（淡蓝天空，色度 65）仍应正确匹配彩色地毯。
    #[test]
    fn bayer_pastel_blue_sky_prefers_light_blue() {
        assert_nearest(&HslBayer, 170, 200, 235, [88, 132, 186]);
    }

    #[test]
    fn bayer_pure_gray_matches_exactly() {
        assert_nearest(&HslBayer, 132, 132, 132, [132, 132, 132]);
    }

    #[test]
    fn bayer_pure_red_matches_red_carpet() {
        assert_nearest(&HslBayer, 255, 0, 0, [132, 44, 44]);
    }

    #[test]
    fn bayer_mid_gray_not_pulled_to_saturated_candidate() {
        assert_nearest(&HslBayer, 128, 128, 128, [132, 132, 132]);
    }
}

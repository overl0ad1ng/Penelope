use crate::algorithm::ColorDistance;

/// 16 种地毯的「normal」颜色（RGB），与 data/blocksArt.json 中 carpet 类一致。
///
/// 调色板稀疏是硬约束：灰度轴只有 4 级（21/65/132/171），跨度大、中间大段灰度无候选；
/// 彩色部分同理，很多区域最近的两个候选色相距较远。这意味着即使抖动算法完全正确，
/// 这些区域的颜色也只能在有限候选之间做最优分配，无法完美还原。
/// 要真正改善，需要从产品层面扩充可用方块颜色（混用羊毛/混凝土/陶瓦等），超出本模块范围。
pub const CARPETS: [[u8; 3]; 16] = [
    [171, 171, 171], // white_carpet
    [186, 109, 44],  // orange_carpet
    [153, 65, 186],  // magenta_carpet
    [88, 132, 186],  // light_blue_carpet
    [197, 197, 44],  // yellow_carpet
    [109, 176, 21],  // lime_carpet
    [208, 109, 142], // pink_carpet
    [65, 65, 65],    // gray_carpet
    [132, 132, 132], // light_gray_carpet
    [65, 109, 132],  // cyan_carpet
    [109, 54, 153],  // purple_carpet
    [44, 65, 153],   // blue_carpet
    [88, 65, 44],    // brown_carpet
    [88, 109, 44],   // green_carpet
    [132, 44, 44],   // red_carpet
    [21, 21, 21],    // black_carpet
];

/// 找出与给定颜色最接近的地毯颜色。
pub fn nearest_carpet(c: &[f32; 3], distance: &dyn ColorDistance) -> [u8; 3] {
    let mut best = CARPETS[0];
    let mut best_dist = distance.distance(c, &best);

    for &carpet in CARPETS.iter().skip(1) {
        let d = distance.distance(c, &carpet);
        if d < best_dist {
            best = carpet;
            best_dist = d;
        }
    }

    best
}

/// 找出与给定颜色最接近的两个地毯颜色，返回 (c1, c2, d1, d2)。
/// c1 最近、c2 次近，d1/d2 为对应距离（供 Bayer 双候选阈值抖动使用）。
pub fn nearest_two_carpets(
    color: &[f32; 3],
    distance: &dyn ColorDistance,
) -> ([u8; 3], [u8; 3], f32, f32) {
    let mut c1 = CARPETS[0];
    let mut d1 = distance.distance(color, &c1);
    let mut c2 = CARPETS[1];
    let mut d2 = distance.distance(color, &c2);

    // 保证 c1 距离更近
    if d2 < d1 {
        std::mem::swap(&mut c1, &mut c2);
        std::mem::swap(&mut d1, &mut d2);
    }

    for &carpet in CARPETS.iter().skip(2) {
        let d = distance.distance(color, &carpet);
        if d < d1 {
            c2 = c1;
            d2 = d1;
            c1 = carpet;
            d1 = d;
        } else if d < d2 {
            c2 = carpet;
            d2 = d;
        }
    }

    (c1, c2, d1, d2)
}
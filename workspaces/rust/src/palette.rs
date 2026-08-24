use crate::algorithm::ColorDistance;

/// 单个方块的预计算数据，颜色取自 data/blocksArt.json（由 build.rs 提取）。
#[derive(Copy, Clone)]
pub struct BlockDef {
    /// 英文名；同时作为 Minecraft 方块 ID 的 slug（block_id = "minecraft:" + name_eng）。
    pub name_eng: &'static str,
    /// normal 亮度地图色——量化 / 抖动运算用。
    pub normal: [u8; 3],
    /// high 亮度地图色——展示输出（预览 PNG）用。
    pub high: [u8; 3],
    /// Minecraft 方块 ID，如 "minecraft:white_carpet"。
    pub block_id: &'static str,
}

include!(concat!(env!("OUT_DIR"), "/palette_blocks.rs"));

/// 在给定调色板中找出与 color 最接近的方块，返回其 normal 颜色。
/// 调色板非空（由 build_palette 保证）；空时本函数会 panic。
pub fn nearest(color: &[f32; 3], distance: &dyn ColorDistance, palette: &[BlockDef]) -> [u8; 3] {
    let mut best = palette[0].normal;
    let mut best_dist = distance.distance(color, &best);

    for b in palette.iter().skip(1) {
        let d = distance.distance(color, &b.normal);
        if d < best_dist {
            best = b.normal;
            best_dist = d;
        }
    }

    best
}

/// 在给定调色板中找出最近的两个方块（normal 颜色），返回 (c1, c2, d1, d2)。
/// c1 最近、c2 次近，d1/d2 为对应距离（供 Bayer 双候选阈值抖动使用）。
/// 调色板仅 1 项时 c2 == c1。
pub fn nearest_two(
    color: &[f32; 3],
    distance: &dyn ColorDistance,
    palette: &[BlockDef],
) -> ([u8; 3], [u8; 3], f32, f32) {
    let mut c1 = palette[0].normal;
    let mut d1 = distance.distance(color, &c1);
    let mut c2 = if palette.len() > 1 {
        palette[1].normal
    } else {
        c1
    };
    let mut d2 = if palette.len() > 1 {
        distance.distance(color, &c2)
    } else {
        d1
    };

    // 保证 c1 距离更近
    if d2 < d1 {
        std::mem::swap(&mut c1, &mut c2);
        std::mem::swap(&mut d1, &mut d2);
    }

    for b in palette.iter().skip(2) {
        let d = distance.distance(color, &b.normal);
        if d < d1 {
            c2 = c1;
            d2 = d1;
            c1 = b.normal;
            d1 = d;
        } else if d < d2 {
            c2 = b.normal;
            d2 = d;
        }
    }

    (c1, c2, d1, d2)
}

/// 由前端选中的 name_eng 列表构建运行期调色板。
///
/// - 空列表 → 地毯子集 CARPETS（默认调色板）。
/// - 未知 name_eng 静默跳过；若结果为空则回退到地毯子集 CARPETS，避免空调色板导致 panic。
/// - 按用户传入顺序、去重。重复颜色的不同方块（如白羊毛 / 白地毯 normal 相同）
///   取列表中靠前者——因此前端可通过排列顺序控制优先级。
pub fn build_palette(blocks: &[String]) -> Vec<BlockDef> {
    if blocks.is_empty() {
        return CARPETS.to_vec();
    }

    let mut out: Vec<BlockDef> = Vec::with_capacity(blocks.len());
    for name in blocks {
        let name = name.as_str();
        if out.iter().any(|b| b.name_eng == name) {
            continue; // 去重
        }
        if let Some(b) = BLOCKS.iter().copied().find(|b| b.name_eng == name) {
            out.push(b);
        }
        // 未知 name_eng 跳过（前端选择器只应发送已知名）
    }

    if out.is_empty() {
        CARPETS.to_vec()
    } else {
        out
    }
}

/// 把 normal 颜色映射为对应方块的 high 颜色（展示输出用）。
/// 重复颜色取调色板中靠前者；找不到则原样返回（安全兜底）。
pub fn high_of(color: &[u8; 3], palette: &[BlockDef]) -> [u8; 3] {
    for b in palette {
        if b.normal == *color {
            return b.high;
        }
    }
    *color
}

/// 把 normal 颜色映射为对应方块的 Minecraft 方块 ID（litematic 导出用）。
/// 重复颜色取调色板中靠前者；找不到则回退到石头（minecraft:stone）。
pub fn block_id_of(color: &[u8; 3], palette: &[BlockDef]) -> &'static str {
    for b in palette {
        if b.normal == *color {
            return b.block_id;
        }
    }
    "minecraft:stone"
}

/// 把 normal 颜色映射为对应方块的 name_eng（前端统计/展示用）。
/// 重复颜色取调色板中靠前者；找不到则回退到 "stone"。
pub fn name_eng_of(color: &[u8; 3], palette: &[BlockDef]) -> &'static str {
    for b in palette {
        if b.normal == *color {
            return b.name_eng;
        }
    }
    "stone"
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn empty_input_returns_carpets() {
        let pal = build_palette(&[]);
        assert_eq!(pal.len(), CARPETS.len());
        assert!(pal.iter().all(|b| b.name_eng.ends_with("_carpet")));
    }

    #[test]
    fn all_unknown_names_falls_back_to_carpets() {
        let pal = build_palette(&["no_such_block".to_string()]);
        assert_eq!(pal.len(), CARPETS.len());
        assert!(pal.iter().all(|b| b.name_eng.ends_with("_carpet")));
    }

    #[test]
    fn selected_names_build_ordered_palette() {
        let pal = build_palette(&["white_carpet".to_string(), "black_carpet".to_string()]);
        assert_eq!(pal.len(), 2);
        assert_eq!(pal[0].name_eng, "white_carpet");
        assert_eq!(pal[1].name_eng, "black_carpet");
    }
}

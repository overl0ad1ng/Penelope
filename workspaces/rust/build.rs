//! 构建脚本：从 `data/blocksArt.json` 提取全量方块（normal/high 颜色 + Minecraft 方块 ID），
//! 生成 `palette_blocks.rs`（`BLOCKS` 全量 + `CARPETS` 地格子集），供 `palette.rs` 用 `include!` 引入。
//!
//! `serde_json` 仅作为 build-dependency，编译到 host、不进入 WASM 产物。
//! 颜色只在 JSON 里维护一次（单一数据源），WASM 侧不内嵌 JSON、不在运行期解析。
//! `block_id` 约定为 `"minecraft:" + name_eng`（数据里所有 name_eng 均为合法 MC 方块 slug）。

use serde_json::Value;
use std::path::PathBuf;

fn main() {
    let manifest_dir =
        std::env::var("CARGO_MANIFEST_DIR").expect("build.rs: CARGO_MANIFEST_DIR 未设置");
    // CARGO_MANIFEST_DIR = .../workspaces/rust，data 在项目根下。
    let json_path = PathBuf::from(&manifest_dir)
        .join("..")
        .join("..")
        .join("data")
        .join("blocksArt.json");
    println!("cargo:rerun-if-changed={}", json_path.display());

    let text = std::fs::read_to_string(&json_path)
        .unwrap_or_else(|e| panic!("build.rs: 读取 {} 失败: {e}", json_path.display()));
    let root: Value = serde_json::from_str(&text).expect("build.rs: blocksArt.json 不是合法 JSON");
    let classes = root
        .as_array()
        .expect("build.rs: blocksArt.json 顶层应为数组");

    // (name_eng, normal, high)
    let mut all: Vec<(String, [u8; 3], [u8; 3])> = Vec::new();
    let mut carpet: Vec<(String, [u8; 3], [u8; 3])> = Vec::new();

    for class in classes {
        let bname_eng = class
            .get("bname_eng")
            .and_then(|v| v.as_str())
            .unwrap_or("");
        let bclass = class
            .get("bclass")
            .and_then(|v| v.as_array())
            .unwrap_or_else(|| panic!("build.rs: {bname_eng} 的 bclass 不是数组"));
        for entry in bclass {
            let name = entry
                .get("name_eng")
                .and_then(|v| v.as_str())
                .unwrap_or_else(|| panic!("build.rs: {bname_eng} 下有条目缺少 name_eng"))
                .to_string();
            let normal = rgb3(entry, "normal_rgb", &name);
            let high = rgb3(entry, "high_rgb", &name);
            all.push((name.clone(), normal, high));
            if bname_eng == "carpet" {
                carpet.push((name, normal, high));
            }
        }
    }

    // CARPETS 子集用于测试与默认场景，固定 16 项；数据若变动会在这里及早失败。
    assert_eq!(
        carpet.len(),
        16,
        "build.rs: carpet 类期望 16 项，实得 {}",
        carpet.len()
    );

    let out_dir = std::env::var("OUT_DIR").expect("build.rs: OUT_DIR 未设置");
    let dest = PathBuf::from(&out_dir).join("palette_blocks.rs");

    let mut s = String::new();
    s.push_str(
        "/// 全量方块注册表（data/blocksArt.json 全部条目，按文件顺序）。自动生成，请勿手改。\n",
    );
    s.push_str("pub static BLOCKS: &[BlockDef] = &[\n");
    for (name, normal, high) in &all {
        let id = format!("minecraft:{name}");
        s.push_str(&format!(
            "    BlockDef {{ name_eng: {name:?}, normal: {normal:?}, high: {high:?}, block_id: {id:?} }},\n",
        ));
    }
    s.push_str("];\n\n");
    s.push_str("/// carpet 类（bid:2）子集，作为默认调色板与测试用例使用。自动生成，请勿手改。\n");
    s.push_str("pub static CARPETS: &[BlockDef] = &[\n");
    for (name, normal, high) in &carpet {
        let id = format!("minecraft:{name}");
        s.push_str(&format!(
            "    BlockDef {{ name_eng: {name:?}, normal: {normal:?}, high: {high:?}, block_id: {id:?} }},\n",
        ));
    }
    s.push_str("];\n");

    std::fs::write(&dest, s)
        .unwrap_or_else(|e| panic!("build.rs: 写入 {} 失败: {e}", dest.display()));
}

/// 读取 entry 里的 3 通道 RGB 数组（normal_rgb / high_rgb / ...），带校验。
fn rgb3(entry: &Value, field: &str, name: &str) -> [u8; 3] {
    let arr = entry
        .get(field)
        .and_then(|v| v.as_array())
        .unwrap_or_else(|| panic!("build.rs: {name} 缺少 {field}"));
    assert_eq!(arr.len(), 3, "build.rs: {name} 的 {field} 不是 3 通道");
    let mut out = [0u8; 3];
    for (i, x) in arr.iter().enumerate() {
        let n = x
            .as_u64()
            .unwrap_or_else(|| panic!("build.rs: {name} 的 {field} 含非整数"))
            as u64;
        assert!(n <= 255, "build.rs: {name} 的 {field} 分量超 u8: {n}");
        out[i] = n as u8;
    }
    out
}

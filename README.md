# Penelope

Penelope（珀涅罗珀）是一款在线的《我的世界》地图画生成网站，它允许你将一张图片根据特定的宽高比、特定的方块，生成出可以在原版《我的世界》当中放置实现的作品。

## 功能

- [ ] 根据你选定的方块类型，将图片转换成地图画
- [ ] 将地图画导出成 litematic 文件

## WASM 图片缩放

图片缩放由 Rust + wasm-bindgen 实现，源码位于 `workspaces/rust`，构建产物输出到 `public/wasm`：

```bash
pnpm build:wasm
```

构建前请先安装 [Rust 工具链](https://rustup.rs)、wasm32 目标与 wasm-pack（详见 `workspaces/rust/README.md`）。

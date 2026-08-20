# penelope-resize

Penelope 的图片缩放 WASM 模块，使用 **Rust + wasm-bindgen** 编写。

## 导出接口

| 函数 | 参数 | 返回 |
| --- | --- | --- |
| `resize_image` | `data: Vec<u8>`, `width: u32`, `height: u32` | `Vec<u8>`（PNG 字节） |

在 JS 侧，`Vec<u8>` 会被 wasm-bindgen 自动桥接为 `Uint8Array`，因此前端调用方式为：

```ts
const input = new Uint8Array(await file.arrayBuffer());
const output = wasm.resize_image(input, width, height); // Uint8Array（PNG）
```

## 前置依赖

1. 安装 Rust 工具链：<https://rustup.rs/>
2. 安装 wasm32 编译目标：

   ```bash
   rustup target add wasm32-unknown-unknown
   ```

3. 安装 wasm-pack：<https://rustwasm.github.io/wasm-pack/installer/>

## 构建

在仓库根目录运行：

```bash
pnpm build:wasm
```

等价于在本目录运行：

```bash
wasm-pack build --target web --out-dir ../../public/wasm --out-name resize --release
```

构建产物会输出到 `public/wasm/`：

- `resize.js` —— wasm-bindgen 的 ESM 胶水代码（默认导出 `init`，具名导出 `resize_image`）
- `resize_bg.wasm` —— 编译出的 WASM 二进制
- `resize.d.ts` —— 类型声明
- `package.json` —— 元信息（可忽略）

> 前端通过 `src/lib/resizeImage.ts` 懒加载并初始化该模块，无需手动处理。

## 支持的图片格式

当前开启：PNG / JPEG / GIF / WebP / BMP。

如需增加格式（例如 AVIF），在 `Cargo.toml` 的 `image` 依赖中补充对应 feature 后重新构建。

# Penelope

Penelope（珀涅罗珀）是一款在线的《我的世界》地图画生成网站，它允许你将一张图片根据特定的宽高比、特定的方块，生成出可以在原版《我的世界》当中放置实现的作品。

## 功能

- [x] 根据你选定的方块类型，将图片转换成地图画
- [x] 将地图画导出成 litematic 文件
  - [x] 允许切片导出 

## 使用方式

我们为您提供了两种使用方式：

### 访问官网

您可以访问我们为您提供的官网：[Penelope](https://penelope.saviya.me) 直接使用。

- 不过由于部分问题，国内地区访问可能并不流畅。

### 本地部署

#### 环境要求

- Node.js >= 20.9（建议使用 22 LTS 或更高版本）
- [pnpm](https://pnpm.io/) >= 9
- [Rust](https://www.rust-lang.org/)（建议通过 [rustup](https://rustup.rs/) 安装）
- [wasm-pack](https://rustwasm.github.io/wasm-pack/)（安装：`cargo install wasm-pack`）

#### 安装依赖

```bash
pnpm install
```

#### 构建 WASM 模块

项目依赖一个由 Rust 编译的 WASM 模块（`workspaces/rust`，负责图片缩放与地图画生成），需要先构建产物到 `public/wasm`：

```bash
pnpm build:wasm
```

> 该步骤在 `pnpm dev` 与 `pnpm build` 之前都需要执行一次。若修改了 `workspaces/rust` 下的 Rust 代码，需重新构建。

#### 启动开发服务器

```bash
pnpm dev
```

启动后访问 [http://localhost:3000](http://localhost:3000)。

#### 构建生产版本

```bash
pnpm build
```

#### 启动生产服务器

```bash
pnpm start
```

构建产物默认输出到 `.next` 目录，生产服务器默认监听 `3000` 端口。如需修改端口或监听地址，可传入参数：

```bash
pnpm start -- -p 8080 -H 0.0.0.0
```


export interface MapArtWasmModule {
  /** wasm-bindgen（--target web）生成的默认导出，用于初始化 WASM 实例。 */
  default(
    input?: RequestInfo | URL | Response | BufferSource | WebAssembly.Module,
  ): Promise<void>;
  /** Rust 端 `mapart` 的 JS 绑定。返回类型标注为 Uint8Array<ArrayBuffer>：
   *  wasm-bindgen 复制出来的字节始终由普通 ArrayBuffer 支撑。 */
  mapart(
    data: Uint8Array,
    width: number,
    height: number,
    dither: string,
    algorithm: string,
    enhance: number,
  ): Uint8Array<ArrayBuffer>;
  /** Rust 端 `export_litematic` 的 JS 绑定。返回 .litematic（gzip NBT）或 .zip 字节。 */
  export_litematic(
    data: Uint8Array,
    width: number,
    height: number,
    dither: string,
    algorithm: string,
    slice: boolean,
    enhance: number,
  ): Uint8Array<ArrayBuffer>;
}

let modulePromise: Promise<MapArtWasmModule> | null = null;

/** 懒加载并初始化 WASM 模块（只初始化一次）。 */
function getWasmModule(): Promise<MapArtWasmModule> {
  if (!modulePromise) {
    modulePromise = (async () => {
      // webpackIgnore 让 Next/Webpack 把 /wasm/resize.js 当作运行时静态资源
      // biome-ignore format: wasm-bindgen 动态导入需保持单行，配合 @ts-expect-error
      // @ts-expect-error - 该模块在运行时才存在，无法静态解析类型。
      const mod = (await import(/* webpackIgnore: true */ "/wasm/resize.js")) as MapArtWasmModule;
      await mod.default("/wasm/resize_bg.wasm");
      return mod;
    })();
  }
  return modulePromise;
}

/**
 * 使用 WASM 把图片缩放到指定宽高，并把每个像素替换成最接近的地毯颜色（地图画）。
 *
 * @param file      前端 <input type="file"> 得到的图片 File。
 * @param width     目标宽度（px）。
 * @param height    目标高度（px）。
 * @param dither    抖动算法（如 "floyd-steinberg"）。
 * @param algorithm 颜色距离算法（如 "redmean"）。
 * @returns 地图画结果（PNG）的 ObjectURL；用完记得 URL.revokeObjectURL。
 */
export async function mapArt(
  file: File,
  width: number,
  height: number,
  dither: string,
  algorithm: string,
  enhance: number,
): Promise<string> {
  const wasm = await getWasmModule();

  const input = new Uint8Array(await file.arrayBuffer());
  const output = wasm.mapart(input, width, height, dither, algorithm, enhance);

  const blob = new Blob([output], { type: "image/png" });
  return URL.createObjectURL(blob);
}

/**
 * 导出 Litematica 投影（Rust 实现）。
 * slice=false 返回单个 .litematic；slice=true 返回打包成 .zip 的 N 个切片。
 *
 * @returns 文件字节，由调用方决定如何保存/下载。
 */
export async function exportLitematic(
  file: File,
  width: number,
  height: number,
  dither: string,
  algorithm: string,
  slice: boolean,
  enhance: number,
): Promise<Uint8Array<ArrayBuffer>> {
  const wasm = await getWasmModule();
  const input = new Uint8Array(await file.arrayBuffer());
  return wasm.export_litematic(
    input,
    width,
    height,
    dither,
    algorithm,
    slice,
    enhance,
  );
}

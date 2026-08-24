/** 单个方块的使用统计（WASM 原始输出；name_eng 为英文 slug，前端再映射为中文名）。 */
export interface UsedBlockStat {
  name_eng: string;
  length: number;
}

/** WASM `mapart` 返回的原始对象。 */
interface WasmMapArtResult {
  png: Uint8Array<ArrayBuffer>;
  blocks: UsedBlockStat[];
}

/** 前端使用的 mapart 结果：预览 PNG 的 ObjectURL + 方块使用统计。 */
export interface MapArtResult {
  url: string;
  blocks: UsedBlockStat[];
}

export interface MapArtWasmModule {
  /** wasm-bindgen（--target web）生成的默认导出，用于初始化 WASM 实例。 */
  default(
    input?: RequestInfo | URL | Response | BufferSource | WebAssembly.Module,
  ): Promise<void>;
  /** Rust 端 `prepare` 的 JS 绑定。预计算调色板和量化颜色并缓存，
   *  供 mapart / export_litematic 共用。输入与缓存一致时跳过耗时重算。 */
  prepare(
    data: Uint8Array,
    width: number,
    height: number,
    dither: string,
    algorithm: string,
    enhance: number,
    blocks: string[],
  ): void;
  /** Rust 端 `mapart` 的 JS 绑定。依赖 prepare 预先缓存的结果。
   *  返回 { png, blocks }：png 为预览 PNG 字节（Uint8Array）；
   *  blocks 为实际使用方块的统计（name_eng + length）。 */
  mapart(): WasmMapArtResult;
  /** Rust 端 `export_litematic` 的 JS 绑定。依赖 prepare 预先缓存的结果。
   *  返回 .litematic（gzip NBT）或 .zip 字节。 */
  export_litematic(slice: boolean): Uint8Array<ArrayBuffer>;
  /** Rust 端 `invalidate` 的 JS 绑定。清除 prepare 缓存。 */
  invalidate(): void;
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

/** 清除 WASM 端的 prepare 缓存（仅在模块已加载时生效）。 */
export function clearCache(): void {
  if (modulePromise) {
    modulePromise.then((wasm) => wasm.invalidate());
  }
}

/**
 * 使用 WASM 把图片缩放到指定宽高，并把每个像素替换成最接近的候选方块颜色（地图画）。
 *
 * @param file      前端 <input type="file"> 得到的图片 File。
 * @param width     目标宽度（px）。
 * @param height    目标高度（px）。
 * @param dither    抖动算法（如 "floyd-steinberg"）。
 * @param algorithm 颜色距离算法（如 "redmean"）。
 * @param enhance   对比度/亮度增强强度（0-100）。
 * @param blocks    用户选中方块的 name_eng 列表；默认所有地毯。
 * @returns 预览 PNG 的 ObjectURL（用完记得 URL.revokeObjectURL）与方块使用统计。
 */
export async function mapArt(
  file: File,
  width: number,
  height: number,
  dither: string,
  algorithm: string,
  enhance: number,
  blocks: string[],
): Promise<MapArtResult> {
  const wasm = await getWasmModule();

  const input = new Uint8Array(await file.arrayBuffer());
  wasm.prepare(input, width, height, dither, algorithm, enhance, blocks);
  const result = wasm.mapart();

  const blob = new Blob([result.png], { type: "image/png" });
  return { url: URL.createObjectURL(blob), blocks: result.blocks };
}

/**
 * 导出 Litematica 投影（Rust 实现）。
 * slice=false 返回单个 .litematic；slice=true 返回打包成 .zip 的 N 个切片。
 *
 * @param blocks    用户选中方块的 name_eng 列表；默认所有地毯。
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
  blocks: string[] = [],
): Promise<Uint8Array<ArrayBuffer>> {
  const wasm = await getWasmModule();
  const input = new Uint8Array(await file.arrayBuffer());
  wasm.prepare(input, width, height, dither, algorithm, enhance, blocks);
  return wasm.export_litematic(slice);
}

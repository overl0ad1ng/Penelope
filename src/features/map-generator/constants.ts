import { clamp } from "@/lib/number";

/** 地图画生成模式 */
export type Options = "upload" | "text" | "qrCode";

/** 宽高单位：x1 = 像素，x128 = 地图画宽度（1 格 = 128 像素） */
export type Multi = "x1" | "x128";

/** 抖动算法 */
export type Dither = "floyd-steinberg" | "atkinson" | "bayer-4x4";

/** 颜色距离算法 */
export type Algorithm =
  | "euclidean"
  | "manhattan"
  | "weighted-euclidean"
  | "redmean";

/** 不同单位下的宽高取值范围 */
export const PIXELART = {
  x1: {
    MAX: 128 * 100,
    MIN: 128,
  },
  x128: {
    MAX: 100,
    MIN: 1,
  },
} as const;

/** 把「单位下的数值」换算为实际像素数 */
export const MultiToNumeric: Record<Multi, (value: number) => number> = {
  x1: (value) => value * 1,
  x128: (value) => value * 128,
};

/**
 * 按单位规范化尺寸：
 * 1. 先 clamp 到该单位允许的 [MIN, MAX] 范围；
 * 2. x1（像素）模式下，再向上取整到 128 的倍数（保证能被切成整数个地图画）。
 */
export function normalizeDimension(value: number, multi: Multi): number {
  const { MAX, MIN } = PIXELART[multi];
  const clamped = clamp(value, MAX, MIN);

  if (multi === "x1") return Math.ceil(clamped / 128) * 128;
  return clamped;
}

/** 某个维度被切成多少个地图画（1 格 = 128 像素）。 */
export function getSliceCount(value: number, multi: Multi): number {
  const normalized = normalizeDimension(value, multi);
  return multi === "x128" ? normalized : normalized / 128;
}

/** 允许上传的图片 MIME 类型 */
export const ACCEPTED_IMAGE_TYPES = [
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
  "image/bmp",
  "image/svg+xml",
  "image/avif",
];

/** 已上传图片的原始尺寸信息 */
export interface ImageInfo {
  width: number;
  height: number;
}

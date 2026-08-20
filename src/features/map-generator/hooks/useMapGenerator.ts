import { useState } from "react";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { downloadBytes } from "@/lib/download";
import { exportLitematic, mapArt } from "@/lib/mapArt";
import type { Algorithm, Dither, Multi } from "../constants";
import {
  getSliceCount,
  MultiToNumeric,
  normalizeDimension,
  PIXELART,
} from "../constants";

/**
 * 地图画生成相关状态：宽高配置、生成结果、生成中标记。
 */
export function useMapGenerator() {
  const [width, setWidth] = useState(4);
  const [height, setHeight] = useState(3);
  const [widthMulti, setWidthMulti] = useState<Multi>("x128");
  const [heightMulti, setHeightMulti] = useState<Multi>("x128");

  const [slice, setSlice] = useLocalStorage<boolean>(
    "penelope.map-generator.slice",
    false,
  );
  const [dither, setDither] = useLocalStorage<Dither>(
    "penelope.map-generator.dither",
    "floyd-steinberg",
  );
  const [algorithm, setAlgorithm] = useLocalStorage<Algorithm>(
    "penelope.map-generator.algorithm",
    "redmean",
  );
  const [enhance, setEnhance] = useLocalStorage<number>(
    "penelope.map-generator.enhance",
    0,
  );

  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  function handleWidthChange(value: string) {
    setWidth(Number(value.replace(/[^0-9]/g, "")));
  }

  function handleHeightChange(value: string) {
    setHeight(Number(value.replace(/[^0-9]/g, "")));
  }

  function handleWidthBlur() {
    setWidth(normalizeDimension(width, widthMulti));
  }

  function handleHeightBlur() {
    setHeight(normalizeDimension(height, heightMulti));
  }

  // 切换单位时，重置为该单位允许的最小值
  function handleWidthMultiChange(multi: Multi) {
    if (multi !== widthMulti) setWidth(PIXELART[multi].MIN);

    setWidthMulti(multi);
  }

  function handleHeightMultiChange(multi: Multi) {
    if (multi !== heightMulti) setHeight(PIXELART[multi].MIN);

    setHeightMulti(multi);
  }

  function clearResult() {
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    setResultUrl(null);
  }

  function generate(file: File | null) {
    if (!file) {
      alert("请先上传一张图片！");
      return;
    }

    const w = MultiToNumeric[widthMulti](normalizeDimension(width, widthMulti));
    const h = MultiToNumeric[heightMulti](
      normalizeDimension(height, heightMulti),
    );

    setGenerating(true);
    mapArt(file, w, h, dither, algorithm, enhance)
      .then(setResultUrl)
      .catch((error) => {
        console.error("地图画生成失败", error);
        alert("地图画生成失败，请查看控制台获取更多信息");
      })
      .finally(() => setGenerating(false));
  }

  async function exportProjection(file: File | null) {
    if (!file) {
      alert("请先上传一张图片！");
      return;
    }

    const w = MultiToNumeric[widthMulti](normalizeDimension(width, widthMulti));
    const h = MultiToNumeric[heightMulti](
      normalizeDimension(height, heightMulti),
    );

    try {
      const bytes = await exportLitematic(
        file,
        w,
        h,
        dither,
        algorithm,
        slice,
        enhance,
      );
      const filename = slice ? "mapart.zip" : "mapart.litematic";
      const mime = slice ? "application/zip" : "application/octet-stream";
      downloadBytes(bytes, filename, mime);
    } catch (error) {
      console.error("导出失败", error);
      alert("导出失败，请查看控制台获取更多信息");
    }
  }

  return {
    width,
    height,
    widthMulti,
    heightMulti,
    resultUrl,
    generating,
    handleWidthChange,
    handleHeightChange,
    handleWidthBlur,
    handleHeightBlur,
    handleWidthMultiChange,
    handleHeightMultiChange,
    clearResult,
    generate,
    exportProjection,
    slice,
    setSlice,
    dither,
    setDither,
    algorithm,
    setAlgorithm,
    enhance,
    setEnhance,
    sliceCols: getSliceCount(width, widthMulti),
    sliceRows: getSliceCount(height, heightMulti),
  };
}

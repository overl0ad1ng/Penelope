import { useEffect, useState } from "react";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { downloadBytes } from "@/lib/download";
import { clearCache, exportLitematic, mapArt } from "@/lib/mapArt";
import type { Algorithm, Dither, Multi } from "../constants";
import {
  getSliceCount,
  MultiToNumeric,
  normalizeDimension,
  PIXELART,
} from "../constants";
import allBlocks from "../../../../data/blocksArt.json";

/** name_eng → 中文 name 的查找表，供方块使用统计结果映射为展示名用。 */
const BLOCK_STATS = new Map<string, { name: string, offset: string }>();
for (const cls of allBlocks) {
  for (const entry of cls.bclass) {
    BLOCK_STATS.set(entry.name_eng, { name: entry.name, offset: entry.offset });
  }
}

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
    "atkinson",
  );
  const [algorithm, setAlgorithm] = useLocalStorage<Algorithm>(
    "penelope.map-generator.algorithm",
    "hsl-atkinson",
  );
  const [enhance, setEnhance] = useLocalStorage<number>(
    "penelope.map-generator.enhance",
    0,
  );
  const [blocks, setBlocks] = useLocalStorage<string[]>(
    "penelope.map-generator.blocks",
    allBlocks.filter(i => i.bname_eng === "carpet")
      .flatMap(i => i.bclass.map(i => i.name_eng)),
  )

  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [usedBlocks, setUsedBlocks] = useState<{ name: string; length: number, offset: string }[]>(
    [],
  );

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

  // 两个 HSL 加权算法各自针对搭档抖动调参，选中时顺带切到对应抖动
  function handleAlgorithmChange(algorithm: Algorithm) {
    setAlgorithm(algorithm);

    if (algorithm === "hsl-atkinson") {
      setDither("atkinson");
    } else if (algorithm === "hsl-bayer") {
      setDither("bayer-4x4");
    }
  }

  function clearResult() {
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    setResultUrl(null);
    setUsedBlocks([]);
  }

  // 任意参数变化时，清除预览结果和 WASM prepare 缓存，
  // 确保下次生成 / 导出使用最新参数。
  useEffect(() => {
    setResultUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setUsedBlocks([]);
    clearCache();
  }, [
    width,
    height,
    widthMulti,
    heightMulti,
    slice,
    dither,
    algorithm,
    enhance,
    blocks,
  ]);

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
    mapArt(file, w, h, dither, algorithm, enhance, blocks)
      .then(({ url, blocks: stats }) => {
        setResultUrl(url);
        setUsedBlocks(
          stats.map((s) => {
            const stat = BLOCK_STATS.get(s.name_eng)!;

            if (!stat) {
              throw new Error(`BLOCK_STATS 非法参数：${s.name_eng}`);
            }

            return {
              length: s.length,
              ...stat
            };
          }),
        );
      })
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

    setGenerating(true);
    try {
      const bytes = await exportLitematic(
        file,
        w,
        h,
        dither,
        algorithm,
        slice,
        enhance,
        blocks,
      );
      const filename = slice ? "mapart.zip" : "mapart.litematic";
      const mime = slice ? "application/zip" : "application/octet-stream";
      downloadBytes(bytes, filename, mime);
    } catch (error) {
      console.error("导出失败", error);
      alert("导出失败，请查看控制台获取更多信息");
    } finally {
      setGenerating(false);
    }
  }

  return {
    width,
    height,
    widthMulti,
    heightMulti,
    resultUrl,
    usedBlocks,
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
    handleAlgorithmChange,
    enhance,
    setEnhance,
    sliceCols: getSliceCount(width, widthMulti),
    sliceRows: getSliceCount(height, heightMulti),
    blocks,
    setBlocks
  };
}

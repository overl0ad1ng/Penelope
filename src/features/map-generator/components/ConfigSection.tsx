import { Button, Input, Select, Slider, Switch, Tooltip } from "minecraft-ui";
import type { ComponentProps } from "react";
import CircleQuestion from "@/icons/CircleQuestion";
import type { Algorithm, Dither, Multi } from "../constants";

const multiOptions: ComponentProps<typeof Select>["options"] = [
  { label: "像素", value: "x1" },
  { label: "地图画宽度", value: "x128" },
];

const ditherOptions: ComponentProps<typeof Select>["options"] = [
  { label: "Floyd–Steinberg 抖动", value: "floyd-steinberg" },
  { label: "Atkinson 抖动", value: "atkinson" },
  { label: "4×4 Bayer 有序抖动", value: "bayer-4x4" },
];

const algorithmOptions: ComponentProps<typeof Select>["options"] = [
  { label: "欧式距离", value: "euclidean" },
  { label: "曼哈顿距离", value: "manhattan" },
  { label: "加权欧式距离", value: "weighted-euclidean" },
  { label: "Redmean 距离", value: "redmean" },
  {
    label: "HSL Atkinson（配 Atkinson）",
    value: "hsl-atkinson",
  },
  {
    label: "HSL Bayer（配 4×4 Bayer）",
    value: "hsl-bayer",
  },
];

interface ConfigSectionProps {
  width: number;
  height: number;
  widthMulti: Multi;
  heightMulti: Multi;
  hasResult: boolean;
  onGenerate: () => void;
  onExport: () => void;
  onWidthChange: (value: string) => void;
  onWidthBlur: () => void;
  onHeightChange: (value: string) => void;
  onHeightBlur: () => void;
  onWidthMultiChange: (value: Multi) => void;
  onHeightMultiChange: (value: Multi) => void;
  slice: boolean;
  onSliceChange: (value: boolean) => void;
  dither: Dither;
  algorithm: Algorithm;
  onDitherChange: (value: Dither) => void;
  onAlgorithmChange: (value: Algorithm) => void;
  enhance: number;
  onEnhanceChange: (value: number) => void;
}

export default function ConfigSection({
  width,
  height,
  widthMulti,
  heightMulti,
  hasResult,
  onGenerate,
  onExport,
  onWidthChange,
  onWidthBlur,
  onHeightChange,
  onHeightBlur,
  onWidthMultiChange,
  onHeightMultiChange,
  slice,
  onSliceChange,
  dither,
  algorithm,
  onDitherChange,
  onAlgorithmChange,
  enhance,
  onEnhanceChange,
}: ConfigSectionProps) {
  return (
    <div className="space-y-2 mt-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl noto-sans text-neutral-200">地图画配置</h1>

        <div className="flex items-center gap-4">
          <Button
            onClick={onGenerate}
            className="text-xs noto-sans"
            variant="primary"
          >
            生成地图画
          </Button>

          <Button
            className="text-xs noto-sans"
            variant={hasResult ? "primary" : "clear"}
            disabled={!hasResult}
            onClick={onExport}
          >
            导出投影
          </Button>
        </div>
      </div>

      <div className="bg-layer p-3 space-y-4">
        <div className="grid grid-cols-2 gap-6">
          <div className="flex flex-col gap-2">
            <p className="text-xs text-neutral-400 noto-sans">宽 Width</p>
            <div className="grid grid-cols-2 gap-2">
              <Input
                value={width}
                onChange={onWidthChange}
                onBlur={onWidthBlur}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="Width"
              />
              <Select
                onChange={(val) => onWidthMultiChange(val as Multi)}
                options={multiOptions}
                placeholder="单位"
                searchPlaceholder="选择一个单位"
                value={widthMulti}
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-xs text-neutral-400 noto-sans">高 Height</p>
            <div className="grid grid-cols-2 gap-2">
              <Input
                value={height}
                onChange={onHeightChange}
                onBlur={onHeightBlur}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="Height"
              />
              <Select
                onChange={(val) => onHeightMultiChange(val as Multi)}
                options={multiOptions}
                placeholder="单位"
                searchPlaceholder="选择一个单位"
                value={heightMulti}
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-1">
              <p className="text-xs text-neutral-400 noto-sans">抖动 Dither</p>
              <Tooltip
                trigger="hover"
                placement="top-start"
                content="抖动对画面鲜艳度影响最大，需要根据图片的鲜艳程度选择不同的抖动"
              >
                <CircleQuestion className="size-3.5 text-neutral-400" />
              </Tooltip>
            </div>
            <Select
              onChange={(val) => onDitherChange(val as Dither)}
              options={ditherOptions}
              placeholder="抖动"
              searchPlaceholder="选择一个抖动算法"
              value={dither}
            />
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-1">
              <p className="text-xs text-neutral-400 noto-sans">
                算法 Algorithm
              </p>
              <Tooltip
                trigger="hover"
                placement="top-start"
                content={
                  <>
                    <p>
                      在颜色很多的情况下，不同的算法可能会有不同的画面鲜艳程度。不过绝大部分情况，16 色地毯并不能够凸显不同算法的效果。
                    </p>
                    <p>
                      默认配置 Redmean 算法最快，通常不需要修改。当颜色
                    </p>
                  </>
                }
              >
                <CircleQuestion className="size-3.5 text-neutral-400" />
              </Tooltip>
            </div>
            <Select
              onChange={(val) => onAlgorithmChange(val as Algorithm)}
              options={algorithmOptions}
              placeholder="算法"
              searchPlaceholder="选择一个颜色距离算法"
              value={algorithm}
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <p className="text-xs text-neutral-400 noto-sans">增强 Enhance</p>
              <Tooltip
                trigger="hover"
                placement="top-start"
                content="增强会提高对比度并降低亮度，让方块颜色层次更清晰"
              >
                <CircleQuestion className="size-3.5 text-neutral-400" />
              </Tooltip>
            </div>
            <p className="text-xs text-neutral-400 noto-sans">
              {enhance === 0 ? "原图" : `${enhance}%`}
            </p>
          </div>
          <Slider
            min={0}
            max={2}
            step={1}
            value={enhance / 50}
            onChange={(val) => onEnhanceChange(val * 50)}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <p className="text-xs text-neutral-400 noto-sans">切片 Slice</p>
            <Tooltip
              trigger="hover"
              placement="top-start"
              content="切片允许你在导出时将一个地图画投影切成 N 个单独的 litematic 投影。每次作画只用导入对应的地图画即可"
            >
              <CircleQuestion className="size-3.5 text-neutral-400" />
            </Tooltip>
          </div>

          <Switch value={slice} onChange={onSliceChange} />
        </div>
      </div>
    </div>
  );
}

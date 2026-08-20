"use client";

import { useState } from "react";
import type { Options } from "@/features/map-generator";
import {
  ConfigSection,
  GeneratingModal,
  ImageGrid,
  InfoSection,
  OptionTabs,
  UploadSection,
  useImageUpload,
  useMapGenerator,
} from "@/features/map-generator";

export default function Home() {
  const [option, setOption] = useState<Options>("upload");

  const upload = useImageUpload();
  const generator = useMapGenerator();

  function handleClear() {
    upload.clear();
    generator.clearResult();
  }

  function handleGenerate() {
    generator.generate(upload.file);
  }

  function handleExport() {
    generator.exportProjection(upload.file);
  }

  return (
    <div className="relative flex min-h-dvh max-h-full flex-col overflow-y-hidden bg-background font-sans text-foreground">
      <main className="mx-auto space-y-2 flex w-full max-w-7xl flex-1 flex-col overflow-y-auto px-6 py-14">
        <div className="space-y-2">
          <h1 className="text-2xl noto-sans text-neutral-200">生成地图画</h1>
          <OptionTabs value={option} onChange={setOption} />
        </div>

        {option === "upload" && (
          <UploadSection
            file={upload.file}
            fileInputRef={upload.fileInputRef}
            onFileChange={upload.handleFileChange}
            onClear={handleClear}
          />
        )}

        <ImageGrid
          previewUrl={upload.previewUrl}
          previewAlt={upload.file?.name ?? "图片预览"}
          resultUrl={generator.resultUrl}
          resultAlt={upload.file?.name ?? "图片预览"}
          slice={generator.slice}
          sliceCols={generator.sliceCols}
          sliceRows={generator.sliceRows}
        />

        <ConfigSection
          width={generator.width}
          height={generator.height}
          widthMulti={generator.widthMulti}
          heightMulti={generator.heightMulti}
          hasResult={Boolean(generator.resultUrl)}
          onGenerate={handleGenerate}
          onExport={handleExport}
          onWidthChange={generator.handleWidthChange}
          onWidthBlur={generator.handleWidthBlur}
          onHeightChange={generator.handleHeightChange}
          onHeightBlur={generator.handleHeightBlur}
          onWidthMultiChange={generator.handleWidthMultiChange}
          onHeightMultiChange={generator.handleHeightMultiChange}
          slice={generator.slice}
          onSliceChange={generator.setSlice}
          dither={generator.dither}
          algorithm={generator.algorithm}
          onDitherChange={generator.setDither}
          onAlgorithmChange={generator.setAlgorithm}
          enhance={generator.enhance}
          onEnhanceChange={generator.setEnhance}
        />

        <InfoSection
          imageInfo={upload.imageInfo}
          width={generator.width}
          height={generator.height}
          widthMulti={generator.widthMulti}
          heightMulti={generator.heightMulti}
        />
      </main>

      <GeneratingModal open={generator.generating} />
    </div>
  );
}

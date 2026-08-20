import type { DataGridItem } from "@/components/DataGrid";
import DataGrid from "@/components/DataGrid";
import { getClosestAspectRatio } from "@/lib/aspectRatio";
import type { ImageInfo, Multi } from "../constants";
import { MultiToNumeric } from "../constants";

interface InfoSectionProps {
  imageInfo: ImageInfo | null;
  width: number;
  height: number;
  widthMulti: Multi;
  heightMulti: Multi;
}

export default function InfoSection({
  imageInfo,
  width,
  height,
  widthMulti,
  heightMulti,
}: InfoSectionProps) {
  const aspectRatio = imageInfo ? imageInfo.width / imageInfo.height : null;

  const originalImageData: DataGridItem[] = [
    { label: "宽度", value: imageInfo ? `${imageInfo.width} px` : "—" },
    { label: "高度", value: imageInfo ? `${imageInfo.height} px` : "—" },
    {
      label: "宽高比",
      value: aspectRatio ? `${aspectRatio.toFixed(2)} : 1` : "—",
    },
    {
      label: "接近的宽高比",
      value: imageInfo
        ? getClosestAspectRatio(imageInfo.width, imageInfo.height)
        : "—",
      tooltip: "最接近的宽高比，是最适合的地图画比例",
    },
  ];

  const multiW = MultiToNumeric[widthMulti](width);
  const multiH = MultiToNumeric[heightMulti](height);
  const blocks = multiH * multiW;
  const slices =
    (widthMulti === "x128" ? width : width / 128) *
    (heightMulti === "x128" ? height : height / 128);

  const schematicData: DataGridItem[] = [
    {
      label: "宽度",
      value: width ? `${multiW} 格` : "—",
    },
    {
      label: "高度",
      value: height ? `${multiH} 格` : "—",
    },
    {
      label: "总方块数",
      value: height ? `${blocks} 个` : "—",
    },
    {
      label: "切割数",
      value: height ? `${slices} 块` : "—",
      tooltip: (
        <>
          <p>
            Penelope 支持将原理图按照 1 个地图画宽度切割成 N 个投影。{slices}{" "}
            将会是这张地图画的切割份数
          </p>
          <p>
            最后将会导出一个文件夹压缩包，里面有 N 个 `N.litematic` 投影文件
          </p>
        </>
      ),
    },
  ];

  return (
    <div className="space-y-4 mt-8">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl noto-sans text-neutral-200">原图信息</h1>
        </div>

        <div className="bg-layer p-3">
          <DataGrid data={originalImageData} />
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl noto-sans text-neutral-200">原理图信息</h1>
        </div>

        <div className="bg-layer p-3">
          <DataGrid data={schematicData} />
        </div>
      </div>
    </div>
  );
}

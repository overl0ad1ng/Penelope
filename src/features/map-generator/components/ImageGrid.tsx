import ImagePreviewer from "@/components/ImagePreviewer";
import SliceGridOverlay from "./SliceGridOverlay";

interface ImageGridProps {
  previewUrl: string | null;
  previewAlt: string;
  resultUrl: string | null;
  resultAlt: string;
  slice: boolean;
  sliceCols: number;
  sliceRows: number;
}

export default function ImageGrid({
  previewUrl,
  previewAlt,
  resultUrl,
  resultAlt,
  slice,
  sliceCols,
  sliceRows,
}: ImageGridProps) {
  const showSliceGrid = slice && sliceCols >= 1 && sliceRows >= 1;

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="bg-layer aspect-video overflow-hidden flex items-center justify-center">
        {previewUrl ? (
          <ImagePreviewer
            src={previewUrl}
            alt={previewAlt}
            className="w-full h-full object-contain"
          />
        ) : (
          <p className="mc text-neutral-500">No Image</p>
        )}
      </div>

      <div className="bg-layer aspect-video overflow-hidden flex items-center justify-center">
        {resultUrl ? (
          showSliceGrid ? (
            <SliceGridOverlay
              src={resultUrl}
              alt={resultAlt}
              cols={sliceCols}
              rows={sliceRows}
            />
          ) : (
            <ImagePreviewer
              src={resultUrl}
              alt={resultAlt}
              className="w-full h-full object-contain"
            />
          )
        ) : (
          <p className="mc text-neutral-500">No Result</p>
        )}
      </div>
    </div>
  );
}

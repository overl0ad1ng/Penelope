import { Button } from "minecraft-ui";
import type { ChangeEvent, RefObject } from "react";
import { ACCEPTED_IMAGE_TYPES } from "../constants";

interface UploadSectionProps {
  file: File | null;
  fileInputRef: RefObject<HTMLInputElement | null>;
  onFileChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onClear: () => void;
}

export default function UploadSection({
  file,
  fileInputRef,
  onFileChange,
  onClear,
}: UploadSectionProps) {
  return (
    <div className="flex items-center justify-between">
      <p className="mc">{file ? file.name : "No Image"}</p>

      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_IMAGE_TYPES.join(",")}
        className="hidden"
        onChange={onFileChange}
      />

      <div className="flex items-center gap-4">
        {file ? (
          <Button
            variant="clear"
            className="text-xs noto-sans"
            onClick={onClear}
          >
            清空选择
          </Button>
        ) : null}
        <Button
          className="text-xs noto-sans"
          onClick={() => fileInputRef.current?.click()}
        >
          选择图片
        </Button>
      </div>
    </div>
  );
}

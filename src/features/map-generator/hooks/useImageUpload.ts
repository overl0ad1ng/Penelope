import type { ChangeEvent } from "react";
import { useEffect, useRef, useState } from "react";
import type { ImageInfo } from "../constants";
import { ACCEPTED_IMAGE_TYPES } from "../constants";

/**
 * 图片上传相关状态：File、预览 ObjectURL、原始尺寸。
 */
export function useImageUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [imageInfo, setImageInfo] = useState<ImageInfo | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // 卸载或预览地址变化时，回收旧的 ObjectURL
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  // 从预览地址读取图片原始尺寸
  useEffect(() => {
    if (!previewUrl) {
      setImageInfo(null);
      return;
    }

    const img = new Image();
    img.onload = () => {
      setImageInfo({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.src = previewUrl;

    return () => {
      img.onload = null;
    };
  }, [previewUrl]);

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0];
    if (!selected) return;

    if (!ACCEPTED_IMAGE_TYPES.includes(selected.type)) {
      alert("仅支持图片文件（png / jpg / jpeg / gif / webp 等）");
      e.target.value = "";
      return;
    }

    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(selected);
    setPreviewUrl(URL.createObjectURL(selected));
  }

  function clear() {
    setFile(null);

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  }

  return {
    file,
    previewUrl,
    imageInfo,
    fileInputRef,
    handleFileChange,
    clear,
  };
}

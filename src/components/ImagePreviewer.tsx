"use client";

import { useEffect, useRef, useState } from "react";

interface ImagePreviewerProps {
  src: string;
  alt?: string;
  className?: string;
}

const MIN_SCALE = 0.5;
const MAX_SCALE = 8;

const clamp = (value: number, min = MIN_SCALE, max = MAX_SCALE) =>
  Math.min(max, Math.max(min, value));

export default function ImagePreviewer({ src, alt, className }: ImagePreviewerProps) {
  const [open, setOpen] = useState(false);
  const [transform, setTransform] = useState({ scale: 1, x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);

  const overlayRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{
    startX: number;
    startY: number;
    originX: number;
    originY: number;
  } | null>(null);

  const openPreview = () => {
    setTransform({ scale: 1, x: 0, y: 0 });
    setOpen(true);
  };

  const closePreview = () => setOpen(false);

  useEffect(() => {
    const overlay = overlayRef.current;
    if (!overlay || !open) return;

    // 原生非 passive 监听，保证滚轮缩放时可以阻止页面滚动
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = overlay.getBoundingClientRect();
      const px = e.clientX - rect.left - rect.width / 2;
      const py = e.clientY - rect.top - rect.height / 2;

      setTransform((prev) => {
        const nextScale = clamp(prev.scale * Math.exp(-e.deltaY * 0.0015));
        const ratio = nextScale / prev.scale;
        // 以光标位置为缩放中心
        return {
          scale: nextScale,
          x: px - (px - prev.x) * ratio,
          y: py - (py - prev.y) * ratio,
        };
      });
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closePreview();
    };

    overlay.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("keydown", onKeyDown);
    return () => {
      overlay.removeEventListener("wheel", onWheel);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const onPointerDown = (e: React.PointerEvent<HTMLImageElement>) => {
    if (transform.scale <= 1) return;
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      originX: transform.x,
      originY: transform.y,
    };
    setDragging(true);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLImageElement>) => {
    const drag = dragRef.current;
    if (!drag) return;
    setTransform((prev) => ({
      ...prev,
      x: drag.originX + (e.clientX - drag.startX),
      y: drag.originY + (e.clientY - drag.startY),
    }));
  };

  const onPointerUp = () => {
    dragRef.current = null;
    setDragging(false);
  };

  return (
    <>
      <img
        src={src}
        alt={alt}
        className={`cursor-zoom-in ${className ?? ""}`}
        onClick={openPreview}
        draggable={false}
      />

      {open && (
        <div
          ref={overlayRef}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 cursor-zoom-out"
          onClick={closePreview}
        >
          <img
            src={src}
            alt={alt}
            draggable={false}
            className={`max-w-full max-h-full select-none touch-none ${
              dragging ? "cursor-grabbing" : "cursor-grab"
            }`}
            style={{
              transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
            }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}

"use client";

import { useLayoutEffect, useRef, useState } from "react";
import ImagePreviewer from "@/components/ImagePreviewer";

interface SliceGridOverlayProps {
  src: string;
  alt: string;
  cols: number;
  rows: number;
}

/**
 * 在结果图上叠加切片网格：cols × rows 个格子，每格虚线边框 + 左上角切片序号。
 * 结果图被 resize 成 cols*128 × rows*128，宽高比等于 cols:rows，
 * 因此按 object-contain 的缩放比例算出图片实际显示盒，网格与之精确对齐。
 */
export default function SliceGridOverlay({
  src,
  alt,
  cols,
  rows,
}: SliceGridOverlayProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState<{ width: number; height: number } | null>(
    null,
  );

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const update = () => {
      const { clientWidth, clientHeight } = el;
      if (clientWidth === 0 || clientHeight === 0) return;

      const scale = Math.min(clientWidth / cols, clientHeight / rows);
      setBox({ width: cols * scale, height: rows * scale });
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [cols, rows]);

  const cells = Array.from({ length: cols * rows }, (_, i) => i + 1).map(
    (n) => (
      <div key={n} className="relative border border-dashed border-white/60">
        <span className="absolute left-1 top-1 bg-black/60 px-1 py-0.5 text-[12px] leading-none text-white rounded-sm">
          {n}
        </span>
      </div>
    ),
  );

  return (
    <div ref={containerRef} className="relative h-full w-full overflow-hidden">
      <ImagePreviewer
        src={src}
        alt={alt}
        className="h-full w-full object-contain"
      />
      {box && (
        <div
          className="pointer-events-none absolute grid"
          style={{
            left: "50%",
            top: "50%",
            width: box.width,
            height: box.height,
            transform: "translate(-50%, -50%)",
            gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
            gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
          }}
        >
          {cells}
        </div>
      )}
    </div>
  );
}

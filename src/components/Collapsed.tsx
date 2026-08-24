"use client";

import { ComponentProps, type ReactNode, useState } from "react";
import cn from "classnames"
import { Checkbox } from "minecraft-ui";

type CHECKED = "all" | "indeterminate" | "none";

export interface CollapsedProps {
  /** 标题，显示在箭头右侧，点击切换展开/收起。 */
  title: ReactNode;
  /** 展开后显示的内容。 */
  children: ReactNode;
  /** 非受控初始展开状态，默认收起。 */
  defaultOpen?: boolean;
  /** 受控展开状态；传入即切换为受控模式。 */
  open?: boolean;
  onToggle?: (open: boolean) => void;
  /** 应用到最外层容器的类名。 */
  className?: string;
  /** 箭头的位置 */
  arrow?: "start" | "end";
  /** 是否包含 checked */
  checked?: CHECKED | "hidden";
  onCheckedChange?: (val: boolean) => void;
}

/**
 * 可折叠区块：左侧像素风箭头（见 globals.css 的 `.mc-arrow::after`，
 * 由 `--mc-arrow__down_clip-path` 切出形状）——收起时指向右侧，
 * 展开时指向下方；点击标题切换。
 *
 * 支持受控（传 `open`）与非受控（传 `defaultOpen`）两种用法。
 */
export default function Collapsed({
  title,
  children,
  defaultOpen = false,
  open: openProp,
  onToggle,
  className,
  arrow = "start",
  checked = "hidden",
  onCheckedChange,
}: CollapsedProps) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const controlled = openProp !== undefined;
  const open = controlled ? openProp : internalOpen;

  function toggle() {
    const next = !open;
    if (!controlled) setInternalOpen(next);
    onToggle?.(next);
  }

  return (
    <div className={cn(
      className,
      "w-full"
    )}>
      <div
        onClick={toggle}
        aria-expanded={open}
        className={cn(
          "flex w-full cursor-pointer items-center gap-2 text-left text-neutral-300 transition-colors hover:text-foreground",
          arrow === "end" && "flex-row-reverse justify-between"
        )}
      >
        <span className="mc-arrow" data-open={open} aria-hidden="true" />
        <div className="flex items-center gap-2">
          {
            checked !== "hidden" && (
              <span onClick={(e) => e.stopPropagation()}>
                <Checkbox
                  onChange={(val) => onCheckedChange?.(val)}
                  value={checked === "all"}
                  indeterminate={checked === "indeterminate"}
                />
              </span>
            )
          }
          <span
            className={cn(
              "text-sm noto-sans",
              checked !== "hidden" && "mb-1"
            )}
          >
            {title}
          </span>
        </div>
      </div>
      {open && <div className="mt-2">{children}</div>}
    </div>
  );
}

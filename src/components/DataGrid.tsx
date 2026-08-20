import React, { ReactNode } from "react";
import CircleQuestion from "@/icons/CircleQuestion";
import { Tooltip } from "minecraft-ui";

export interface DataGridItem {
  label: string;
  value: ReactNode;
  /** 有值时在 label 后显示一个 CircleQuestion 图标 */
  tooltip?: React.ReactNode;
}

interface DataGridProps {
  data: DataGridItem[];
  columns?: number;
}

export default function DataGrid({ data, columns = 2 }: DataGridProps) {
  return (
    <div
      className="grid gap-x-6 gap-y-3"
      style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
    >
      {data.map((item) => (
        <div
          key={item.label}
          className="flex items-baseline justify-between gap-4 border-b border-neutral-600 pb-1.5"
        >
          <span className="text-xs text-neutral-400 noto-sans shrink-0 flex items-center gap-1">
            {item.label}
            {item.tooltip && (
              <Tooltip trigger="hover" placement="top-start" content={item.tooltip}>
                <CircleQuestion className="size-3.5 text-neutral-400" />
              </Tooltip>
            )}
          </span>
          <span className="text-sm text-neutral-100 mc text-right">
            {item.value}
          </span>
        </div>
      ))}
    </div>
  );
}

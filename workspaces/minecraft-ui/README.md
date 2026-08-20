# minecraft-ui

Minecraft 风格的 React UI 组件库（penelope 项目本地 workspace 包）。

## 使用

```tsx
import { Button, Panel, ProgressBar, Slot, Tooltip, Modal } from "minecraft-ui";

export default function Demo() {
  return (
    <Panel title="标题">
      <Button>确定</Button>
      <ProgressBar value={60} color="xp" showLabel />
      <Slot selected />
    </Panel>
  );
}
```

## 组件

| 组件 | 说明 |
| --- | --- |
| `Button` | 像素按钮，`variant`: primary / secondary / danger |
| `Panel` | 像素描边面板，可选 `title` |
| `ProgressBar` | 进度条，`color`: xp / hunger / health |
| `Slot` | 物品栏格子，可选 `selected`、`size` |
| `Tooltip` | 悬浮提示，`side`: top / bottom |
| `Modal` | 模态框（需客户端组件），支持 Esc 关闭 |

## 开发说明

- 组件直接以 TSX 源码形式导出，由 Next.js 的 `transpilePackages` 编译，改动即时生效，无需构建步骤。
- 样式使用 Tailwind CSS，主应用通过 `@source` 指令扫描本包的 class。
- `Modal` 使用了客户端 Hook（`useEffect` / `createPortal`），内部已标注 `"use client"`，在主应用直接 import 即可。

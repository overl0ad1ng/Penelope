import { ButtonGroup } from "minecraft-ui";
import type { ComponentProps } from "react";
import type { Options } from "../constants";

const options: ComponentProps<typeof ButtonGroup>["options"] = [
  { label: "上传图片", value: "upload" },
  { label: "文本", value: "text", disabled: true },
  { label: "二维码", value: "qrCode", disabled: true },
];

interface OptionTabsProps {
  value: Options;
  onChange: (value: Options) => void;
}

export default function OptionTabs({ value, onChange }: OptionTabsProps) {
  return (
    <ButtonGroup
      className="noto-sans"
      onChange={(val) => onChange(val as Options)}
      options={options}
      value={value}
    />
  );
}

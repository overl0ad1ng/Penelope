import * as React from "react";
import cn from "classnames";
import { useEventListener } from "usehooks-ts";
import Button from "../../buttons/button";
import "./Slider.css";

export type SliderProps = {
  children?: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  type?: "button" | "submit" | "reset";
  variant?: "primary" | "secondary" | "tertiary";
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
};

const Slider = ({ disabled, className, value = 50, onChange, min = 0, max = 100 }: SliderProps) => {
  const [isFocus, setFocus] = React.useState<boolean>(false);
  const [isDragging, setIsDragging] = React.useState<boolean>(false);
  const sliderRef = React.useRef<HTMLDivElement>(null);

  const handleFocus = () => {
    setFocus(true);
  };

  const handleBlur = () => {
    setFocus(false);
  };

  const handleMouseDown: React.MouseEventHandler<HTMLDivElement> = (event) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleMouseUp = (event: MouseEvent) => {
    if (isDragging) {
      event.preventDefault();
      setIsDragging(false);
    }
  };

  const relativeValue = ((value - min) / (max - min)) * 100;

  const handleMouseMove = (event: MouseEvent) => {
    if (isDragging) {
      const { clientX } = event;
      const { left, width } = sliderRef.current?.getBoundingClientRect() || {
        left: 0,
        width: 0,
      };
      const relativeX = (clientX - left) / width;
      const newValue = Math.round(relativeX * (max - min)) + min;
      onChange(Math.min(max, Math.max(min, newValue)));
    }
  };
  const handleClick = (event: React.MouseEvent) => {
    const { clientX } = event;
    const { left, width } = sliderRef.current?.getBoundingClientRect() || {
      left: 0,
      width: 0,
    };
    const relativeX = (clientX - left) / width;
    const newValue = Math.round(relativeX * (max - min)) + min;
    onChange(Math.min(max, Math.max(min, newValue)));
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "ArrowLeft") {
      onChange(Math.max(min, value - 1));
    } else if (event.key === "ArrowRight") {
      onChange(Math.min(max, value + 1));
    }
  };

  const backgroundRailStyles = (() => ({
    backgroundImage: `
    linear-gradient(to right, ${value === min ? "transparent" : "var(--slider-rail-fill-color)"}, ${Array.from(
      new Array(max - min - 1),
    )
      .map(
        (_, index) =>
          `${index + 1 <= value - min ? "var(--slider-rail-fill-color)" : "transparent"} calc(${
            (100 / (max - min)) * (index + 1)
          }% - 2px), ` +
          `black calc(${(100 / (max - min)) * (index + 1)}% - 2px), ` +
          `black calc(${(100 / (max - min)) * (index + 1)}% + 2px), ` +
          `${index + 2 <= value - min ? "var(--slider-rail-fill-color)" : "transparent"} calc(${
            (100 / (max - min)) * (index + 1)
          }% + 2px)`,
      )
      .join(", ")}, ${value === max ? "var(--slider-rail-fill-color)" : "transparent"})
`,
  }))();

  useEventListener("mousemove", handleMouseMove);
  useEventListener("mouseup", handleMouseUp);

  return (
    <div
      className={cn("Slider", className, {
        ["Slider_disabled"]: disabled,
        ["Slider_dragging"]: isDragging,
        ["Slider_focus"]: isFocus,
      })}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
    >
      <div
        ref={sliderRef}
        className={cn("SliderRail", className, { Slider_disabled: disabled })}
        style={backgroundRailStyles}
      >
        <Button
          variant={"secondary"}
          disabled={disabled}
          style={{ left: `calc(${relativeValue}% ` }}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          onBlur={handleBlur}
        >
          <span className={cn("SliderTooltip")} style={{ left: "50%" }}>
            <span className={cn("SliderTooltipWrapper")}>{value}</span>
          </span>
        </Button>
      </div>
    </div>
  );
};

export default Slider;

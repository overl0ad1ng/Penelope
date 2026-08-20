import React, { useEffect, useImperativeHandle } from "react";
import ReactDOM from "react-dom";
import { Placement } from "@popperjs/core";
import { usePopper } from "react-popper";
import cn from "classnames";
import "./Tooltip.css";

type TooltipProps = {
  content: React.ReactNode;
  children: React.ReactNode;
  placement?: Placement;
  trigger?: "hover" | "click";
};

const Tooltip = React.forwardRef(({ content, children, placement, trigger }: TooltipProps, ref: any) => {
  const [visible, setVisible] = React.useState<boolean>(false);
  const [referenceElement, setReferenceElement] = React.useState<HTMLSpanElement | null>();
  const [popperElement, setPopperElement] = React.useState<HTMLDivElement | null>(null);
  const [arrowElement, setArrowElement] = React.useState<HTMLSpanElement | null>();
  const instance = usePopper(referenceElement, popperElement, {
    placement,
    modifiers: [
      {
        name: "arrow",
        options: {
          element: arrowElement,
          padding: 0,
        },
      },
    ],
  });
  const { styles, attributes } = instance;

  useImperativeHandle(ref, () => instance);

  const handleMouseEnter = () => {
    if (trigger === "hover") {
      setVisible(true);
    }
  };
  const handleMouseLeave = () => {
    if (trigger === "hover") {
      setVisible(false);
    }
  };
  const handleMouseDown = () => {
    if (trigger === "click") {
      setVisible(!visible);
    }
  };

  useEffect(() => {
    if (visible && trigger === "click") {
      const handler: (event: MouseEvent | TouchEvent) => void = (event) => {
        if (
          !referenceElement?.contains(event.target as HTMLElement) &&
          !popperElement?.contains(event.target as HTMLElement)
        ) {
          setVisible(false);
        }
      };
      document.addEventListener("touchstart", handler);
      document.addEventListener("mousedown", handler);
      return () => {
        document.removeEventListener("touchstart", handler);
        document.removeEventListener("mousedown", handler);
      };
    }
  }, [visible, trigger, referenceElement, popperElement]);

  return (
    <>
      <span
        ref={setReferenceElement}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onMouseDown={handleMouseDown}
        className={cn("TooltipTarget", { visible })}
      >
        {children}
      </span>
      {visible &&
        ReactDOM.createPortal(
          <div
            ref={setPopperElement}
            style={styles.popper}
            className={cn("Tooltip", {
              ["Tooltip_visible"]: visible,
              [`Tooltip_${placement}`]: true,
            })}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            {...attributes.popper}
          >
            <span
              ref={setArrowElement}
              data-popper-arrow
              style={styles.arrow}
              className={cn("TooltipArrow")}
              {...attributes.arrow}
            />
            <div className={cn("TooltipWrapper noto-sans")}>{content}</div>
          </div>,
          document.querySelector("body")!
        )}
    </>
  );
});

export default Tooltip;

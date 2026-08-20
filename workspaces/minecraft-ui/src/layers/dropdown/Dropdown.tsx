import React from "react";
import ReactDOM from "react-dom";
import { Placement } from "@popperjs/core";
import { usePopper } from "react-popper";
import cn from "classnames";
import "./Dropdown.css";

export type DropdownTargetProps = {
  open: () => void;
  close: () => void;
  visible: boolean;
  ref: React.LegacyRef<HTMLDivElement> | undefined;
  className: string;
};

export type TargetFunction = (
  targetProps: DropdownTargetProps
) => React.ReactNode;

export type Target =
  | React.ReactElement<any, string | React.JSXElementConstructor<any>>
  | TargetFunction;

export type DropdownProps = {
  content: React.ReactNode;
  target: Target;
  /**
   * If true, Dropdown closes by clicking on the content.
   */
  closeOnClickContent?: boolean;

  /**
   * If true, Dropdown closes by clicking outside the content.
   */
  closeOnClickOutside?: boolean;

  placement?: Placement;
  trigger?: "click" | "hover";
};

const Dropdown = ({
  content,
  target,
  placement,
  closeOnClickContent,
  closeOnClickOutside,
  trigger,
}: DropdownProps) => {
  const [visible, setVisible] = React.useState<boolean>(false);
  const [referenceElement, setReferenceElement] =
    React.useState<HTMLDivElement | null>();
  const [popperElement, setPopperElement] =
    React.useState<HTMLDivElement | null>();

  const instance = usePopper(referenceElement, popperElement, {
    placement,
    modifiers: [],
  });

  const { styles, attributes } = instance;

  const handleMouseDown = () => {
    setVisible(!visible);
  };

  const handleMouseEnter = () => {
    if (trigger === "hover" && !visible) {
      setVisible(true);
    }
  };

  const handleMouseLeave = () => {
    if (trigger === "hover" && visible) {
      setVisible(false);
    }
  };

  const handleClickOnContent = () => {
    if (closeOnClickContent) {
      setVisible(false);
    }
  };

  React.useEffect(() => {
    if (visible && trigger === "click") {
      const handler: EventListener = (event) => {
        if (
          closeOnClickOutside &&
          // @ts-ignore: Unreachable code error
          !referenceElement.contains(event.target) &&
          // @ts-ignore: Unreachable code error
          !popperElement.contains(event.target)
        ) {
          setVisible(false);
        }
      };
      document.addEventListener("mousedown", handler);
      return () => {
        document.removeEventListener("mousedown", handler);
      };
    }
  }, [visible, referenceElement, popperElement]);

  React.useEffect(() => {
    if (visible && trigger === "hover") {
      const handler: EventListener = (event) => {
        if (
          // @ts-ignore: Unreachable code error
          !referenceElement.contains(event.target) &&
          // @ts-ignore: Unreachable code error
          !popperElement.contains(event.target)
        ) {
          setVisible(false);
        }
      };
      document.addEventListener("mouseleave", handler);
      return () => {
        document.removeEventListener("mouseleave", handler);
      };
    }
  }, [visible, referenceElement, popperElement]);

  return (
    <>
      {typeof target === "function"
        ? target({
            ref: setReferenceElement,
            open: () => setVisible(true),
            close: () => setVisible(false),
            visible,
            className: cn("DropdownTarget", {
              ["DropdownTarget_visible"]: visible,
            }),
          })
        : React.cloneElement(target, {
            ref: setReferenceElement,
            onClick: handleMouseDown,
            onMouseEnter: handleMouseEnter,
            onMouseMove: handleMouseEnter,
            onMouseLeave: handleMouseLeave,
            active: visible,
            className: cn("DropdownTarget", target.props.className, {
              ["DropdownTarget_visible"]: visible,
            }),
          })}
      {visible &&
        ReactDOM.createPortal(
          <div
            ref={setPopperElement}
            style={{
              ...styles.popper,
              // @ts-ignore: Unreachable code error
              minWidth: `${instance?.state?.elements?.reference?.offsetWidth}px`,
            }}
            className={cn("Dropdown", {
              ["Dropdown_visible"]: visible,
            })}
            onClick={handleClickOnContent}
            onMouseEnter={handleMouseEnter}
            onMouseMove={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            {...attributes.popper}
          >
            {content}
          </div>,
          document.querySelector("body")!
        )}
    </>
  );
};

export default Dropdown;

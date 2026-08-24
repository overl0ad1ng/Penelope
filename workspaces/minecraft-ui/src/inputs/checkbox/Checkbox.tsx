import React from "react";
import cn from "classnames";
import "./Checkbox.css";

export type CheckboxProps = Omit<
  React.HTMLProps<HTMLInputElement>,
  "onChange" | "value"
> & {
  value?: boolean;
  onChange: (
    value: boolean,
    event: React.ChangeEvent<HTMLInputElement>
  ) => void;
  disabled?: boolean;
  indeterminate?: boolean;
  className?: string;
  label?: string;
};

const Checkbox = React.forwardRef(
  (
    {
      onChange,
      disabled,
      className,
      value,
      indeterminate,
      label,
      onClick,
      ...rest
    }: CheckboxProps,
    ref?: React.Ref<HTMLInputElement>
  ) => {
    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      onChange(event.target.checked, event);
    };
    return (
      <input
        ref={ref}
        type="checkbox"
        disabled={disabled}
        checked={value}
        onChange={handleChange}
        className={cn("Checkbox", className, {
          [`Checkbox_indeterminate`]: indeterminate,
        })}
        {...rest}
      />
    );
  }
);

export default Checkbox;

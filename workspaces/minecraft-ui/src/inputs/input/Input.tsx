import React from "react";
import cn from "classnames";
import "./Input.css";

export type InputProps = Omit<React.HTMLProps<HTMLInputElement>, "onChange"> & {
  onChange: (
    value: string,
    event?: React.ChangeEvent<HTMLInputElement>
  ) => void;
  disabled?: boolean;
  className?: string;
};

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ onChange, disabled, className, ...rest }, ref) => {
    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      onChange(event.target.value, event);
    };

    return (
      <input
        ref={ref}
        disabled={disabled}
        onChange={handleChange}
        className={cn("Input", className)}
        {...rest}
      />
    );
  }
);

export default Input;

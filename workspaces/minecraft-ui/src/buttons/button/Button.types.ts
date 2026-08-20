import React from "react";

export interface ButtonProps extends React.HTMLProps<HTMLButtonElement> {
  children?: React.ReactNode;
  onClick?: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
  disabled?: boolean;
  active?: boolean;
  className?: string;
  type?: "button" | "submit" | "reset";
  variant?: "primary" | "secondary" | "clear";
}

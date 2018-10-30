import React from "react";

export interface ButtonCustomStyles {
  color?: string;
  backgroundColor?: string
  [invalidProp: string]: any
}

export interface ButtonProps {
  onClick: () => {},
  className: string;
  style?: ButtonCustomStyles;
  children: React.ReactNode;
}

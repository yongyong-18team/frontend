import type { ButtonHTMLAttributes } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "soft" | "outline";
  fullWidth?: boolean;
};

/** Figma Button: 높이 56, 모서리 16, 17px Bold */
const VARIANT = {
  primary: "bg-primary-strong text-text-on-primary",
  soft: "bg-primary-soft text-primary-strong",
  outline: "border-[1.5px] border-line-strong bg-bg-surface text-text-primary",
} as const;

export default function Button({
  variant = "primary",
  fullWidth = true,
  type = "button",
  disabled,
  className = "",
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled}
      className={`flex h-14 min-w-0 items-center justify-center rounded-button px-5 text-subhead font-bold transition-opacity active:opacity-80 ${
        fullWidth ? "w-full" : ""
      } ${disabled ? "bg-line-strong text-text-tertiary" : VARIANT[variant]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
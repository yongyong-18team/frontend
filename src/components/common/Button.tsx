import type { ButtonHTMLAttributes, ReactNode } from "react";

export type ButtonVariant = "primary" | "soft" | "outline";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  /** 기본 true: 가로 꽉 채움 */
  fullWidth?: boolean;
  children: ReactNode;
};

const variantClass: Record<ButtonVariant, string> = {
  primary: "bg-primary-strong text-text-on-primary",
  soft: "bg-primary-soft text-primary-strong",
  outline: "bg-bg-surface text-text-primary border-[1.5px] border-line-strong",
};

/** 큰 버튼 (높이 56). disabled면 회색 비활성 스타일 */
export default function Button({
  variant = "primary",
  fullWidth = true,
  disabled,
  type = "button",
  className = "",
  children,
  ...rest
}: ButtonProps) {
  const look = disabled ? "bg-line-base text-text-tertiary cursor-not-allowed" : variantClass[variant];
  return (
    <button
      type={type}
      disabled={disabled}
      className={`inline-flex h-14 items-center justify-center gap-2 rounded-button px-5 text-subhead font-bold transition-opacity active:opacity-80 ${look} ${fullWidth ? "w-full" : ""} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
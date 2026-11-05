import type { HTMLAttributes } from "react";

export type CardTone = "surface" | "primary" | "mint" | "peach" | "sky" | "butter" | "pink";

const toneClass: Record<CardTone, string> = {
  surface: "bg-bg-surface",
  primary: "bg-primary-soft",
  mint: "bg-mint-soft",
  peach: "bg-peach-soft",
  sky: "bg-sky-soft",
  butter: "bg-butter-soft",
  pink: "bg-pink-soft",
};

type CardProps = HTMLAttributes<HTMLDivElement> & { tone?: CardTone };

/** 둥근 카드 (모서리 20, 안쪽 여백 18) */
export default function Card({ tone = "surface", className = "", children, ...rest }: CardProps) {
  return (
    <div className={`rounded-card p-[18px] ${toneClass[tone]} ${className}`} {...rest}>
      {children}
    </div>
  );
}
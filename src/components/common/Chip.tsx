import type { HTMLAttributes } from "react";

type ChipTone = "primary" | "mint" | "peach" | "sky" | "butter" | "pink" | "neutral";

type ChipProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: ChipTone;
};

const TONE: Record<ChipTone, string> = {
  primary: "bg-primary-soft text-primary-strong",
  mint: "bg-mint-soft text-mint-strong",
  peach: "bg-peach-soft text-peach-strong",
  sky: "bg-sky-soft text-sky-strong",
  butter: "bg-butter-soft text-peach-strong",
  pink: "bg-pink-soft text-pink-strong",
  neutral: "bg-bg-subtle text-text-secondary",
};

/** Figma Chip: 좌우 10·상하 4, 13px Bold, 줄간격 1.4 */
export default function Chip({ tone = "primary", className = "", children, ...rest }: ChipProps) {
  return (
    <span
      className={`inline-flex shrink-0 items-center whitespace-nowrap rounded-chip px-2.5 py-1 text-caption font-bold leading-[1.4] ${TONE[tone]} ${className}`}
      {...rest}
    >
      {children}
    </span>
  );
}
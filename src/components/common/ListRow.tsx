import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronRightIcon } from "@/components/icons/Icons";
import { TONE_CLASS, type Tone } from "@/components/icons/SectionIcons";

type ListRowProps = {
  title: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  iconTone?: Tone;
  trailing?: ReactNode;
  href?: string;
  onClick?: () => void;
  /** md: 3.1 목록 (아이콘 칸 40, 제목 15) / lg: 5.0 메뉴 (아이콘 칸 44, 제목 16) */
  size?: "md" | "lg";
  className?: string;
};

const SIZE = {
  md: { row: "gap-3", box: "h-10 w-10 rounded-[12px]", title: "text-body", textGap: "gap-0.5" },
  lg: { row: "gap-3.5", box: "h-11 w-11 rounded-[13px]", title: "text-body-lg", textGap: "gap-[3px]" },
} as const;

/** Figma 목록 한 줄: 상하 14 */
export default function ListRow({
  title,
  description,
  icon,
  iconTone = "primary",
  trailing,
  href,
  onClick,
  size = "md",
  className = "",
}: ListRowProps) {
  const s = SIZE[size];
  const clickable = !!href || !!onClick;

  const content = (
    <>
      {icon && (
        <span className={`flex shrink-0 items-center justify-center ${s.box} ${TONE_CLASS[iconTone]}`}>{icon}</span>
      )}
      <span className={`flex min-w-0 flex-1 flex-col ${s.textGap}`}>
        <span className={`${s.title} font-bold leading-[1.45] text-text-primary`}>{title}</span>
        {description && <span className="text-caption text-text-secondary">{description}</span>}
      </span>
      {trailing ?? (clickable && <ChevronRightIcon size={20} className="shrink-0 text-text-tertiary" />)}
    </>
  );

  const base = `flex w-full items-center py-3.5 text-left ${s.row} ${className}`;

  if (href) {
    return (
      <Link href={href} className={`${base} active:opacity-70`}>
        {content}
      </Link>
    );
  }
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={`${base} active:opacity-70`}>
        {content}
      </button>
    );
  }
  return <div className={base}>{content}</div>;
}
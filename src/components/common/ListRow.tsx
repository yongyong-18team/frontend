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
  className?: string;
};

/** Figma 목록 한 줄: 상하 14, 간격 12, 아이콘 칸 40·모서리 12, 제목 15 Bold, 설명 13 */
export default function ListRow({
  title,
  description,
  icon,
  iconTone = "primary",
  trailing,
  href,
  onClick,
  className = "",
}: ListRowProps) {
  const clickable = !!href || !!onClick;

  const content = (
    <>
      {icon && (
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] ${TONE_CLASS[iconTone]}`}>
          {icon}
        </span>
      )}
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-body font-bold leading-[1.45] text-text-primary">{title}</span>
        {description && <span className="text-caption text-text-secondary">{description}</span>}
      </span>
      {trailing ?? (clickable && <ChevronRightIcon size={20} className="shrink-0 text-text-tertiary" />)}
    </>
  );

  const base = `flex w-full items-center gap-3 py-3.5 text-left ${className}`;

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
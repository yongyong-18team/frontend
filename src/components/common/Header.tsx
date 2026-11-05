"use client";

import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeftIcon } from "@/components/icons/Icons";

type HeaderProps = {
  title: ReactNode;
  subtitle?: ReactNode;
  back?: boolean;
  onBack?: () => void;
  right?: ReactNode;
};

/** Figma header: 제목 24 Bold, 부제 15 secondary, 간격 4 / 뒤로가기 ‹ 26 */
export default function Header({ title, subtitle, back, onBack, right }: HeaderProps) {
  const router = useRouter();

  return (
    <header className={`flex flex-col px-6 pb-5 ${back ? "pt-1" : "pt-6"}`}>
      {back && (
        <button
          type="button"
          aria-label="뒤로 가기"
          onClick={onBack ?? (() => router.back())}
          className="-ml-[17px] mb-[5px] flex h-11 w-11 items-center justify-center text-text-primary"
        >
          <ChevronLeftIcon size={26} />
        </button>
      )}
      <div className="flex items-start gap-3">
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <h1 className="text-title font-bold text-text-primary">{title}</h1>
          {subtitle && <p className="text-body leading-[1.45] text-text-secondary">{subtitle}</p>}
        </div>
        {right && <div className="mt-2 shrink-0">{right}</div>}
      </div>
    </header>
  );
}
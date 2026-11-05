"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { ChevronLeftIcon } from "../icons/Icons";

type HeaderProps = {
  title: string;
  subtitle?: string;
  /** 왼쪽 위 뒤로가기(‹) 표시 */
  back?: boolean;
  /** 기본은 router.back(). 미저장 변경 확인 등이 필요하면 직접 전달 */
  onBack?: () => void;
  /** 제목 오른쪽 요소 (예: 공유 버튼, 갱신일 칩) */
  right?: ReactNode;
};

/** 화면 상단 제목 영역 */
export default function Header({ title, subtitle, back = false, onBack, right }: HeaderProps) {
  const router = useRouter();
  return (
    <header className="px-6 pt-4 pb-2">
      {back && (
        <button
          type="button"
          aria-label="뒤로 가기"
          onClick={onBack ?? (() => router.back())}
          className="-ml-2.5 mb-2 flex h-11 w-11 items-center justify-center text-text-primary"
        >
          <ChevronLeftIcon size={26} />
        </button>
      )}
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <h1 className="text-title font-bold text-text-primary">{title}</h1>
          {subtitle && <p className="mt-1 text-body text-text-secondary">{subtitle}</p>}
        </div>
        {right}
      </div>
    </header>
  );
}
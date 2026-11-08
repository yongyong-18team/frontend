// src/components/onboarding/OnboardingShell.tsx
// 0.2 온보딩 공통 틀 (Figma 34:1736 · 34:1766 · 34:1803 · 34:1856)
//   뒤로가기 → 단계 표시(1~4) → 제목·설명 → 내용 → 아래 고정 버튼
// 하단 탭은 BottomNav HIDDEN_PREFIXES에 '/onboarding'을 넣어 숨깁니다 (B 요청)

'use client';

import type { ReactNode } from 'react';

import { CheckIcon, ChevronLeftIcon } from '@/components/icons/Icons';

type Props = {
  step: 1 | 2 | 3 | 4;
  title: string;
  description: string;
  onBack: () => void;
  children: ReactNode;
  /** 아래 고정 영역 (버튼 + 안내 문구) */
  footer: ReactNode;
};

export default function OnboardingShell({ step, title, description, onBack, children, footer }: Props) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[390px] flex-col bg-bg-base">
      <div className="flex-1 px-6 pt-2.5">
        <button type="button" onClick={onBack} aria-label="이전 단계로" className="-ml-2 flex size-[42px] items-center justify-center text-text-primary">
          <ChevronLeftIcon size={26} />
        </button>
        <Stepper step={step} />
        <header className="mt-[22px] flex flex-col gap-1.5">
          <h1 className="text-[26px] leading-[1.35] font-bold tracking-[-0.015em] text-text-primary">{title}</h1>
          <p className="text-body leading-[1.45] text-text-secondary">{description}</p>
        </header>
        <div className="mt-6 pb-8">{children}</div>
      </div>

      {/* 아래 고정 버튼 — 내용이 길어 스크롤돼도 항상 보이게 */}
      <div className="sticky bottom-0 bg-bg-base px-6 pt-3 pb-[max(24px,env(safe-area-inset-bottom))]">
        <div className="flex flex-col items-center gap-3">{footer}</div>
      </div>
    </main>
  );
}

/** 1 ─ 2 ─ 3 ─ 4 (지난 단계는 체크, 지금 단계는 진한 주황) */
function Stepper({ step }: { step: number }) {
  return (
    <ol className="mt-4 flex items-center gap-1.5" aria-label={`4단계 중 ${step}단계`}>
      {[1, 2, 3, 4].map((n) => {
        const done = n < step;
        const current = n === step;
        return (
          <li key={n} className={`flex items-center gap-1.5 ${n < 4 ? 'flex-1' : ''}`} aria-current={current ? 'step' : undefined}>
            <span
              className={`flex size-7 shrink-0 items-center justify-center rounded-full text-[13px] leading-none font-bold ${
                done ? 'bg-primary-base text-text-on-primary' : current ? 'bg-primary-strong text-text-on-primary' : 'bg-bg-subtle text-text-tertiary'
              }`}
            >
              {done ? <CheckIcon size={14} /> : n}
            </span>
            {n < 4 && <span className={`h-[3px] flex-1 rounded-[2px] ${n < step ? 'bg-primary-base' : 'bg-line-base'}`} aria-hidden />}
          </li>
        );
      })}
    </ol>
  );
}

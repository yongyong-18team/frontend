// src/components/auth/AuthScreen.tsx
// 0.1 로그인·회원가입 공통 화면 (Figma 0.1-A·B·C)
//   - 연한 주황 배경 + 장식 원 3개 + 로고 + 문구
//   - 아래 흰 시트 안에 "로그인 · 회원가입" 탭 → 각 폼
// 이미 로그인돼 있으면 홈으로 보냅니다.

'use client';

/* eslint-disable @next/next/no-img-element -- 고정 장식·로고라 img 사용 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import LoginForm from '@/components/auth/LoginForm';
import SignupForm from '@/components/auth/SignupForm';
import { isLoggedIn } from '@/lib/auth/session';

type Tab = 'login' | 'signup';

export default function AuthScreen() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('login');

  useEffect(() => {
    if (isLoggedIn()) router.replace('/home');
  }, [router]);

  return (
    <main className="relative mx-auto flex min-h-dvh w-full max-w-[390px] flex-col overflow-hidden bg-primary-soft">
      {/* 장식 원 (Figma deco 3개) */}
      <img src="/images/deco-peach.svg" alt="" aria-hidden width={220} height={220} className="pointer-events-none absolute -top-[50px] -left-[70px] size-[220px]" />
      <img src="/images/deco-mint.svg" alt="" aria-hidden width={190} height={190} className="pointer-events-none absolute top-[110px] left-[270px] size-[190px]" />
      <img src="/images/deco-butter.svg" alt="" aria-hidden width={160} height={160} className="pointer-events-none absolute -top-[90px] left-[230px] size-[160px]" />

      {/* 로고 + 문구 */}
      <div className="relative px-7 pt-[62px]">
        <div className="size-[76px] overflow-hidden rounded-[22px] bg-bg-surface shadow-[0_6px_16px_rgba(184,84,59,0.14)]">
          <img src="/images/logo.png" alt="용용 로고" width={76} height={76} className="size-[76px] object-cover" />
        </div>
        <div className="mt-[14px] flex flex-col gap-2">
          <h1 className="text-[27px] leading-[1.35] font-bold text-text-primary">
            오늘의 기록이
            <br />
            내일의 돌봄이 됩니다
          </h1>
          <p className="text-body leading-[1.45] font-medium text-text-secondary">돌봄의 흐름을 잇는 공간</p>
        </div>
      </div>

      {/* 흰 시트 */}
      <section className="relative mt-4 flex-1 rounded-t-[32px] bg-bg-surface px-6 pt-[30px] pb-10 shadow-sheet">
        <div className="flex items-center gap-[10px] text-[20px] leading-[1.45] font-bold" role="tablist" aria-label="로그인 또는 회원가입">
          <TabButton active={tab === 'login'} onClick={() => setTab('login')}>
            로그인
          </TabButton>
          <span aria-hidden className="text-text-tertiary">
            ·
          </span>
          <TabButton active={tab === 'signup'} onClick={() => setTab('signup')}>
            회원가입
          </TabButton>
        </div>

        <div className="mt-[18px]">{tab === 'login' ? <LoginForm /> : <SignupForm />}</div>
      </section>
    </main>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={active ? 'text-primary-strong' : 'text-text-tertiary'}
    >
      {children}
    </button>
  );
}

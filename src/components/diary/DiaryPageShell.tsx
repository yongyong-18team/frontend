// src/components/diary/DiaryPageShell.tsx
// 2.2·2.3 화면 공통 틀: B의 공통 Header(뒤로가기 + 제목 + 부제) + 본문
// - 위쪽 40px: 상태 표시줄 자리 (Figma 기준 뒤로가기 아이콘이 위에서 54px)
// - Header 아래에 이미 20px 여백이 있으므로, 본문 첫 요소의 mt는 Figma 간격에서 20을 뺀 값
// - 하단 탭 높이만큼 아래 여백, 마지막 버튼은 mt-auto로 아래에 붙음

import type { ReactNode } from 'react';

import Header from '@/components/common/Header';

type Props = {
  title: string;
  desc: string;
  /** 뒤로가기 동작을 바꾸고 싶을 때. 기본은 브라우저 뒤로가기 */
  onBack?: () => void;
  /** 오른쪽 위 버튼 (예: 기록 삭제) */
  right?: ReactNode;
  children: ReactNode;
};

export default function DiaryPageShell({ title, desc, onBack, right, children }: Props) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[390px] flex-col bg-bg-base pt-10 pb-[104px]">
      <Header title={title} subtitle={desc} back onBack={onBack} right={right} />
      <div className="flex flex-1 flex-col px-6">{children}</div>
    </main>
  );
}

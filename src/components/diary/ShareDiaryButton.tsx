// src/components/diary/ShareDiaryButton.tsx
// 일일 기록 공유 — 이 기록을 공유 대상으로 지정해 4.1로 (PRD 2.4 "일일 기록 공유 → DAILY 문서 유형으로 4.1 이동")
// - 승인된 항목만 공유됨 (서버 SHARE-01·02가 승인 정보만 사용)
// - 2.3 오른쪽 위 "공유"(삭제 옆), 공동 관리자 일일 기록 상세는 아래 버튼으로 씀
// TODO(디자인): Figma에 일일 기록 공유 버튼 위치가 없어 임시로 둠

'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import Button from '@/components/common/Button';

export const dailyShareHref = (diaryId: number) => `/share?documentType=DAILY&sourceDiaryId=${diaryId}`;

/** 헤더 오른쪽 글자 버튼 (삭제 버튼과 같은 모양·누르는 영역 44px) */
export function ShareDiaryHeaderLink({ diaryId }: { diaryId: number }) {
  return (
    <Link
      href={dailyShareHref(diaryId)}
      className="-mx-2 -my-3 flex min-h-11 min-w-11 items-center justify-center px-3 py-3 text-body font-medium text-primary-strong"
    >
      공유
    </Link>
  );
}

/** 화면 아래 큰 버튼 */
export function ShareDiaryButton({ diaryId, className }: { diaryId: number; className?: string }) {
  const router = useRouter();
  return (
    <Button variant="outline" className={className} onClick={() => router.push(dailyShareHref(diaryId))}>
      이 기록 공유하기
    </Button>
  );
}

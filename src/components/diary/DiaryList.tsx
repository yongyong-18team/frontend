// src/components/diary/DiaryList.tsx
// 2.4 돌봄 기록 목록 ("돌봄 기록" 탭 첫 화면)
//   - 기본       Figma 35:2849: 주간 리포트 배너, 필터(전체·이번 주·지난달), 새 기록, 날짜별 목록
//   - [예외] 기록 없음  Figma 35:2944: 필터만 남기고 빈 상태 + "첫 기록 작성하기"
//
// - 상태 칩(승인 완료·검토 대기)은 표시만 함. 줄 전체(›)를 누르면 2.3으로 이동
//
// 개발 중 "기록 없음" 화면은 /diary?empty 로 확인

'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import Button from '@/components/common/Button';
import Chip from '@/components/common/Chip';
import Header from '@/components/common/Header';
import { EmptyState, ErrorState, LoadingState } from '@/components/common/StateView';
import { ChartIcon, ChevronRightIcon, PlusIcon } from '@/components/icons/Icons';
import { useDiaryList } from '@/hooks/useDiaryList';
import type { DiaryListItem, WeeklyReportBanner } from '@/lib/api/diary';
import { formatKoreanDate, fromDateKey, isLastMonth, isThisWeek } from '@/lib/date';

const NEW_DIARY_PATH = '/diary/new';

type Filter = 'ALL' | 'THIS_WEEK' | 'LAST_MONTH';
const FILTERS: { value: Filter; label: string }[] = [
  { value: 'ALL', label: '전체' },
  { value: 'THIS_WEEK', label: '이번 주' },
  { value: 'LAST_MONTH', label: '지난달' },
];

const STATUS_CHIP = {
  APPROVED: { label: '승인 완료', tone: 'mint' },
  PENDING_REVIEW: { label: '검토 대기', tone: 'peach' },
} as const;

/** 목록 줄(›)을 누르면 상태와 관계없이 2.3 검토 화면으로. 지난번 승인·제외 상태가 그대로 보임 */
function recordHref(item: DiaryListItem) {
  return `/diary/${item.diaryId}/review`;
}

export default function DiaryList() {
  const router = useRouter();
  const { state, retry } = useDiaryList();
  const [filter, setFilter] = useState<Filter>('ALL');

  const hasRecords = state.phase === 'done' && state.items.length > 0;

  // 데이터가 온 뒤(브라우저)에만 오늘 날짜로 거름
  const visibleItems =
    state.phase === 'done'
      ? state.items.filter((item) => {
          if (filter === 'ALL') return true;
          const date = fromDateKey(item.date);
          const today = new Date();
          return filter === 'THIS_WEEK' ? isThisWeek(date, today) : isLastMonth(date, today);
        })
      : [];

  return (
    // 위쪽 38px + Header 안쪽 24px = Figma 제목 위치 62px (탭 첫 화면이라 뒤로가기 없음)
    <main className="mx-auto flex min-h-dvh w-full max-w-[390px] flex-col bg-bg-base pt-[38px] pb-[104px]">
      <Header title="돌봄 기록" subtitle="날짜별 기록을 확인하고 공유하세요" />

      <div className="flex flex-1 flex-col gap-3.5 px-6">
        {state.phase === 'done' && state.banner.available && hasRecords && (
          <ReportBanner banner={state.banner} />
        )}

        {/* 필터 + 새 기록 */}
        <div className="flex items-center gap-2">
          <div className="flex gap-2" role="tablist" aria-label="기간">
            {FILTERS.map(({ value, label }) => {
              const active = filter === value;
              return (
                <button
                  key={value}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setFilter(value)}
                  className={`rounded-chip border px-4 py-2 text-[14px] leading-[1.4] font-bold ${
                    active
                      ? 'border-primary-strong bg-primary-strong text-text-on-primary'
                      : 'border-line-strong bg-bg-surface text-text-secondary'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
          <span className="flex-1" />
          {hasRecords && (
            <Link
              href={NEW_DIARY_PATH}
              className="flex items-center gap-1 rounded-chip bg-primary-soft px-3 py-2 text-[14px] leading-[1.4] font-bold text-primary-strong active:opacity-80"
            >
              <PlusIcon size={16} />새 기록
            </Link>
          )}
        </div>

        {state.phase === 'loading' && <LoadingState count={3} label="기록을 불러오는 중이에요" />}

        {state.phase === 'error' && (
          <div className="mt-6">
            <ErrorState message="기록을 불러오지 못했어요" onRetry={retry} />
          </div>
        )}

        {/* [예외] 기록 없음 (Figma 35:2944) */}
        {state.phase === 'done' && !hasRecords && (
          <>
            <div className="mt-[88px]">
              <EmptyState
                title="아직 기록이 없어요"
                description={'오늘 있었던 일을 짧게라도 남겨 보세요.\n첫 기록부터 돌봄 설명서가 만들어져요.'}
              />
            </div>
            <div className="mt-auto pt-6">
              <Button onClick={() => router.push(NEW_DIARY_PATH)}>첫 기록 작성하기</Button>
            </div>
          </>
        )}

        {/* 기록은 있지만 고른 기간에 없을 때 */}
        {hasRecords && visibleItems.length === 0 && (
          <p className="rounded-card bg-bg-surface px-4 py-8 text-center text-body text-text-secondary">
            이 기간에는 기록이 없어요
          </p>
        )}

        {visibleItems.length > 0 && (
          <ul className="flex flex-col rounded-card bg-bg-surface px-4 py-1">
            {visibleItems.map((item, i) => (
              <li key={item.diaryId} className={i < visibleItems.length - 1 ? 'border-b border-line-base' : ''}>
                <RecordRow item={item} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}

function RecordRow({ item }: { item: DiaryListItem }) {
  const chip = STATUS_CHIP[item.status];
  return (
    <Link href={recordHref(item)} className="flex items-center gap-3 py-[14px] active:opacity-80">
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className="text-body-lg leading-[1.45] font-bold whitespace-nowrap text-text-primary">
            {formatKoreanDate(fromDateKey(item.date))}
          </span>
          <Chip tone={chip.tone}>{chip.label}</Chip>
        </div>
        <p className="truncate text-[14px] leading-[1.45] text-text-secondary">{item.summary}</p>
      </div>
      <ChevronRightIcon size={20} className="shrink-0 text-text-tertiary" />
    </Link>
  );
}

function ReportBanner({ banner }: { banner: WeeklyReportBanner }) {
  // 2.5 주간 리포트 (프론트 A, report 폴더)
  const href = banner.periodStart ? `/report?periodStart=${banner.periodStart}` : '/report';
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-card bg-sky-soft px-4 py-[14px] active:opacity-80"
    >
      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-sky-base text-sky-strong">
        <ChartIcon size={20} />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5 leading-[1.45]">
        <span className="text-body font-bold text-text-primary">이번 주 리포트가 준비됐어요</span>
        <span className="text-caption text-text-secondary">반복된 행동과 대처 경향을 확인해 보세요</span>
      </span>
      <ChevronRightIcon size={20} className="shrink-0 text-sky-strong" />
    </Link>
  );
}

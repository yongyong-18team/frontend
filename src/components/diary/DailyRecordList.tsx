// src/components/diary/DailyRecordList.tsx
// 2.4 돌봄 기록 — 공동 관리자(CO) 화면 (REPORT-01)
// - OWNER 화면(DiaryList)과 같은 틀: 제목, 기간 필터(전체·이번 주·지난달), 날짜별 목록
// - 일기 원문 대신 서버가 만든 한 줄 요약 + 반영된 항목 수
// - 새 기록·삭제·검토 없음 (공동 관리자는 보기만)
// - 줄을 누르면 일일 기록 상세(REPORT-02, /diary/daily/{diaryId})
// TODO(디자인): Figma에 공동 관리자용 2.4가 없어 OWNER 화면 모양을 따름. 부제·빈 화면 문구 확인

'use client';

import Link from 'next/link';
import { useState } from 'react';

import Chip from '@/components/common/Chip';
import Header from '@/components/common/Header';
import { EmptyState, ErrorState, LoadingState } from '@/components/common/StateView';
import { ChevronRightIcon } from '@/components/icons/Icons';
import { useLoad } from '@/hooks/useLoad';
import { getErrorMessage } from '@/lib/api/client';
import { dailyRecordHref, getDailyRecords, type DailyRecordSummary } from '@/lib/api/dailyRecord';
import { formatKoreanDate, fromDateKey, lastMonthRange, thisWeekRange } from '@/lib/date';

type Filter = 'ALL' | 'THIS_WEEK' | 'LAST_MONTH';

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'ALL', label: '전체' },
  { value: 'THIS_WEEK', label: '이번 주' },
  { value: 'LAST_MONTH', label: '지난달' },
];

function rangeOf(filter: Filter) {
  const today = new Date();
  if (filter === 'THIS_WEEK') return thisWeekRange(today);
  if (filter === 'LAST_MONTH') return lastMonthRange(today);
  return {};
}

export default function DailyRecordList() {
  const [filter, setFilter] = useState<Filter>('ALL');

  return (
    // DiaryList와 같은 여백 (탭 첫 화면이라 뒤로가기 없음)
    <main className="mx-auto flex min-h-dvh w-full max-w-[390px] flex-col bg-bg-base pt-[38px] pb-[104px]">
      <Header title="돌봄 기록" subtitle="설명서에 반영된 기록을 날짜별로 확인하세요" />

      <div className="flex flex-1 flex-col gap-3.5 px-6">
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

        {/* key: 필터가 바뀌면 처음부터 다시 불러옴 */}
        <Records key={filter} filter={filter} />
      </div>
    </main>
  );
}

function Records({ filter }: { filter: Filter }) {
  const { state, retry } = useLoad(() => getDailyRecords(rangeOf(filter)));

  if (state.phase === 'loading') return <LoadingState count={3} label="정보를 불러오고 있어요." />;

  if (state.phase === 'error') {
    return (
      <div className="mt-6">
        <ErrorState message={getErrorMessage(state.error)} onRetry={retry} />
      </div>
    );
  }

  const { records } = state.data;

  if (records.length === 0) {
    return filter === 'ALL' ? (
      <div className="mt-[88px]">
        <EmptyState title="아직 반영된 기록이 없어요." description="보호자가 기록을 설명서에 반영하면 여기에 보여요." />
      </div>
    ) : (
      <p className="rounded-card bg-bg-surface px-4 py-8 text-center text-body text-text-secondary">
        이 기간에는 기록이 없어요
      </p>
    );
  }

  return (
    <ul className="flex flex-col rounded-card bg-bg-surface px-4 py-1">
      {records.map((record, i) => (
        <li key={record.diaryId} className={i < records.length - 1 ? 'border-b border-line-base' : ''}>
          <RecordRow record={record} />
        </li>
      ))}
    </ul>
  );
}

function RecordRow({ record }: { record: DailyRecordSummary }) {
  return (
    <Link href={dailyRecordHref(record.diaryId)} className="flex items-center gap-3 py-[14px] active:opacity-80">
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className="text-body-lg leading-[1.45] font-bold whitespace-nowrap text-text-primary">
            {formatKoreanDate(fromDateKey(record.diaryDate))}
          </span>
          <Chip tone="mint">반영 {record.approvedCount}개</Chip>
        </div>
        {record.summary && <p className="truncate text-[14px] leading-[1.45] text-text-secondary">{record.summary}</p>}
      </div>
      <ChevronRightIcon size={20} className="shrink-0 text-text-tertiary" />
    </Link>
  );
}

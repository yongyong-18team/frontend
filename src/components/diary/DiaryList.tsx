// src/components/diary/DiaryList.tsx
// 2.4 돌봄 기록 목록 ("돌봄 기록" 탭 첫 화면, OWNER 기준 DIARY-03)
//   - 기본       Figma 35:2849: 주간 리포트 배너, 필터(전체·이번 주·지난달), 새 기록, 날짜별 목록
//   - [예외] 기록 없음  Figma 35:2944: 필터만 남기고 빈 상태 + "첫 기록 작성하기"
// - 상태 칩은 표시만 함: 분석 전(NONE)·검토 대기(PENDING)·승인 완료(APPROVED)
// - 줄을 누르면 2.3 검토 (분석 전 기록은 2.2에서 분석부터)
// - 한 줄 요약은 일기 원문 앞부분(preview)
//
// TODO: 공동 관리자(CO)는 REPORT-01·02를 써야 함 (명세 2-4). 지금은 OWNER 화면만
// 개발 중: /diary?seed 예시 넣기, /diary?reset 모두 지우기

'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useSyncExternalStore } from 'react';

import Button from '@/components/common/Button';
import Chip from '@/components/common/Chip';
import Header from '@/components/common/Header';
import { EmptyState, ErrorState, LoadingState } from '@/components/common/StateView';
import { ChartIcon, ChevronRightIcon, PlusIcon } from '@/components/icons/Icons';
import { useDiaryList, type DiaryFilter } from '@/hooks/useDiaryList';
import { getErrorMessage } from '@/lib/api/client';
import type { DiaryListItem, ReviewStatus } from '@/lib/api/diary';
import { formatKoreanDate, fromDateKey } from '@/lib/date';

const NEW_DIARY_PATH = '/diary/new';

// 다른 화면에서 끝내고 돌아왔을 때 한 번 보여줄 안내 (?done=…). 문구: 기획 문구 확정안 v1.4
// TODO(B): 공통 토스트가 생기면 그걸로 교체
const DONE_MESSAGE: Record<string, string> = {
  reflected: '선택한 정보가 돌봄 설명서에 반영됐어요.',
  deleted: '돌봄 기록이 삭제됐어요.',
};
const noop = () => () => {};
const readDone = () => new URLSearchParams(window.location.search).get('done');
const REPORT_PATH = '/report';

const FILTERS: { value: DiaryFilter; label: string }[] = [
  { value: 'ALL', label: '전체' },
  { value: 'THIS_WEEK', label: '이번 주' },
  { value: 'LAST_MONTH', label: '지난달' },
];

const STATUS_CHIP: Record<ReviewStatus, { label: string; tone: 'mint' | 'peach' | 'neutral' }> = {
  APPROVED: { label: '승인 완료', tone: 'mint' },
  PENDING: { label: '검토 대기', tone: 'peach' },
  NONE: { label: '분석 전', tone: 'neutral' },
};

function recordHref(item: DiaryListItem) {
  return item.reviewStatus === 'NONE' ? `/diary/${item.diaryId}/result` : `/diary/${item.diaryId}/review`;
}

export default function DiaryList() {
  const router = useRouter();
  const [filter, setFilter] = useState<DiaryFilter>('ALL');
  const { state, hasAnyRecords, showReportBanner, loadMore, retry } = useDiaryList(filter);
  const done = useSyncExternalStore(noop, readDone, () => null);
  const [doneClosed, setDoneClosed] = useState(false);
  const doneMessage = !doneClosed && done ? DONE_MESSAGE[done] : undefined;

  const noRecordsAtAll = hasAnyRecords === false;
  const items = state.phase === 'done' ? state.items : [];

  return (
    // 위쪽 38px + Header 안쪽 24px = Figma 제목 위치 62px (탭 첫 화면이라 뒤로가기 없음)
    <main className="mx-auto flex min-h-dvh w-full max-w-[390px] flex-col bg-bg-base pt-[38px] pb-[104px]">
      <Header title="돌봄 기록" subtitle="날짜별 기록을 확인하고 공유하세요" />

      <div className="flex flex-1 flex-col gap-3.5 px-6">
        {doneMessage && (
          <p role="status" className="flex items-center gap-2 rounded-card bg-mint-soft px-4 py-3 text-body font-medium text-mint-strong">
            <span className="flex-1">{doneMessage}</span>
            <button
              type="button"
              aria-label="안내 닫기"
              className="text-caption text-mint-strong underline"
              onClick={() => {
                setDoneClosed(true);
                // 새로고침해도 다시 안 뜨게 주소에서 지움
                router.replace('/diary');
              }}
            >
              닫기
            </button>
          </p>
        )}

        {/* REPORT-03은 P1: 최근 7일 기록이 있으면 표시 */}
        {showReportBanner && !noRecordsAtAll && <ReportBanner />}

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
          {!noRecordsAtAll && (
            <Link
              href={NEW_DIARY_PATH}
              className="flex items-center gap-1 rounded-chip bg-primary-soft px-3 py-2 text-[14px] leading-[1.4] font-bold text-primary-strong active:opacity-80"
            >
              <PlusIcon size={16} />새 기록
            </Link>
          )}
        </div>

        {state.phase === 'loading' && <LoadingState count={3} label="정보를 불러오고 있어요." />}

        {state.phase === 'error' && (
          <div className="mt-6">
            <ErrorState message={getErrorMessage(state.error)} onRetry={retry} />
          </div>
        )}

        {/* [예외] 기록 없음 (Figma 35:2944) */}
        {state.phase === 'done' && noRecordsAtAll && (
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
        {state.phase === 'done' && !noRecordsAtAll && items.length === 0 && (
          <p className="rounded-card bg-bg-surface px-4 py-8 text-center text-body text-text-secondary">
            이 기간에는 기록이 없어요
          </p>
        )}

        {items.length > 0 && (
          <ul className="flex flex-col rounded-card bg-bg-surface px-4 py-1">
            {items.map((item, i) => (
              <li key={item.diaryId} className={i < items.length - 1 ? 'border-b border-line-base' : ''}>
                <RecordRow item={item} />
              </li>
            ))}
          </ul>
        )}

        {state.phase === 'done' && items.length < state.total && (
          <div className="flex flex-col items-center gap-1">
            <Button variant="outline" onClick={loadMore} disabled={state.loadingMore}>
              {state.loadingMore ? '불러오는 중…' : '더 보기'}
            </Button>
            {state.moreError && <p className="text-caption text-pink-strong">불러오지 못했어요. 다시 눌러 주세요.</p>}
          </div>
        )}
      </div>
    </main>
  );
}

function RecordRow({ item }: { item: DiaryListItem }) {
  const chip = STATUS_CHIP[item.reviewStatus] ?? STATUS_CHIP.NONE;
  return (
    <Link href={recordHref(item)} className="flex items-center gap-3 py-[14px] active:opacity-80">
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className="text-body-lg leading-[1.45] font-bold whitespace-nowrap text-text-primary">
            {formatKoreanDate(fromDateKey(item.diaryDate))}
          </span>
          <Chip tone={chip.tone}>{chip.label}</Chip>
        </div>
        <p className="truncate text-[14px] leading-[1.45] text-text-secondary">{item.preview}</p>
      </div>
      <ChevronRightIcon size={20} className="shrink-0 text-text-tertiary" />
    </Link>
  );
}

function ReportBanner() {
  // 2.5 주간 리포트: 오늘 포함 최근 7일 (REPORT-03 endDate 생략 = 오늘)
  return (
    <Link href={REPORT_PATH} className="flex items-center gap-3 rounded-card bg-sky-soft px-4 py-[14px] active:opacity-80">
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

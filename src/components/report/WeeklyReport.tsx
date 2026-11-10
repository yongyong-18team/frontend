// src/components/report/WeeklyReport.tsx
// 2.5 주간 돌봄 리포트 (Figma 35:3004, REPORT-03 — 명세상 P1)
//   - 기간: endDate 포함 최근 7일
//   - 요약 카드: 기록 수(recordCount) + 요약 문장(summaryLines, 기록 3건 미만이면 없음)
//   - 일별 도전 행동 막대 그래프 (dailyTrend.behaviorCount, 가장 많은 날 진한 색)
//   - 관찰된 행동 패턴 (repeatedBehaviors + timePattern)
//   - 새로 반영된 정보 (keyChanges) → 누르면 그 일기 상세(2.3)
//   - 기록 0건 → "생성 불가" 안내
//   - "리포트 공유하기" → B의 공유 화면 (/share?documentType=WEEKLY&periodStart=…)

'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import Button from '@/components/common/Button';
import { EmptyState, ErrorState, LoadingState } from '@/components/common/StateView';
import { SECTION_LABEL, timeSlotLabel } from '@/components/diary/category';
import DiaryPageShell from '@/components/diary/DiaryPageShell';
import { ChevronRightIcon } from '@/components/icons/Icons';
import { useWeeklyReport } from '@/hooks/useWeeklyReport';
import { ApiError, CLIENT_ERROR, getErrorMessage } from '@/lib/api/client';
import type { DailyTrend, KeyChange, WeeklyReport as WeeklyReportData } from '@/lib/api/report';
import { formatMonthDay, fromDateKey, weekdayLabel } from '@/lib/date';

const TITLE = '주간 돌봄 리포트';

/** 막대 최대 높이 78px, 0건은 6px 회색 막대 (Figma 기준) */
const BAR_MAX = 78;
const BAR_EMPTY = 6;

export function barHeight(count: number, max: number) {
  if (count <= 0 || max <= 0) return BAR_EMPTY;
  return Math.max(BAR_EMPTY, Math.round((count / max) * BAR_MAX));
}

export default function WeeklyReport({ endDate }: { endDate?: string }) {
  const router = useRouter();
  const { state, retry } = useWeeklyReport(endDate);

  const periodLabel =
    state.phase === 'done'
      ? `${formatMonthDay(fromDateKey(state.report.periodStart))} ~ ${formatMonthDay(fromDateKey(state.report.periodEnd))}`
      : ' '; // 불러오는 동안 줄 높이 유지

  if (state.phase === 'loading') {
    return (
      <DiaryPageShell title={TITLE} desc={periodLabel}>
        <div className="mt-2">
          <LoadingState count={3} label="정보를 불러오고 있어요." />
        </div>
      </DiaryPageShell>
    );
  }

  if (state.phase === 'error') {
    return (
      <DiaryPageShell title={TITLE} desc={periodLabel}>
        <div className="mt-[34px]">
          <ErrorState message={reportErrorMessage(state.error)} onRetry={retry} />
        </div>
      </DiaryPageShell>
    );
  }

  const { report } = state;

  // 기록 0건 → 생성 불가 (Figma 없음)
  if (report.recordCount === 0) {
    return (
      <DiaryPageShell title={TITLE} desc={periodLabel}>
        <div className="mt-[34px]">
          <EmptyState
            title="아직 분석할 기록이 없어요."
            description="기록이 더 쌓이면 주간 요약을 확인할 수 있어요."
            actionLabel="기록하러 가기"
            onAction={() => router.push('/diary/new')}
          />
        </div>
      </DiaryPageShell>
    );
  }

  const shareHref = `/share?documentType=WEEKLY&periodStart=${report.periodStart}`;

  return (
    <DiaryPageShell title={TITLE} desc={periodLabel}>
      <div className="mt-2 flex flex-col gap-3">
        {/* 기록 요약 */}
        <section className="flex flex-col gap-1 rounded-card bg-primary-soft px-[18px] py-4">
          <p className="text-heading font-bold text-text-primary">
            이번 주 {report.dailyTrend.filter((d) => d.recordCount > 0).length}일 기록했어요
          </p>
          <SummaryLines report={report} />
        </section>

        {/* 일별 도전 행동 기록 */}
        <section className="flex flex-col gap-3 rounded-card bg-bg-surface px-[18px] py-4">
          <h2 className="text-body leading-[1.45] font-bold text-text-primary">일별 도전 행동 기록</h2>
          <DailyBars trend={report.dailyTrend} />
        </section>

        {report.copingMethods && <CopingMethods methods={report.copingMethods} />}

        <PatternAndChanges report={report} />
      </div>

      <div className="mt-auto pt-6">
        <Button onClick={() => router.push(shareHref)}>리포트 공유하기</Button>
      </div>
    </DiaryPageShell>
  );
}

/** 안정에 도움 된 방법 (기획 문구 확정안 v1.4 2.5 "대응"). 많이 쓴 순서로 3개까지. TODO(B 디자인): Figma 없음, 임시 카드 */
function CopingMethods({ methods }: { methods: { content: string; count: number }[] }) {
  return (
    <section className="flex flex-col gap-2.5 rounded-card bg-mint-soft px-[18px] py-4">
      <h2 className="text-body leading-[1.45] font-bold text-text-primary">안정에 도움 된 방법</h2>
      {methods.length === 0 ? (
        <p className="text-[14px] leading-[1.45] text-text-secondary">이번 주에 기록된 대처 방법이 없어요.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {methods.slice(0, 3).map((m) => (
            <li key={m.content} className="flex items-start gap-2.5 text-body leading-[1.45] text-text-primary">
              <span className="mt-[7px] size-2 shrink-0 rounded-full bg-mint-strong" aria-hidden />
              <span className="min-w-0 flex-1">{m.content}</span>
              {m.count > 1 && <span className="shrink-0 text-caption font-bold text-mint-strong">{m.count}번</span>}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function SummaryLines({ report }: { report: WeeklyReportData }) {
  // 승인 기록 3건 미만이면 summaryLines가 비어 있음 → 기획 확정안 "데이터 부족" 문구
  const lines = report.summaryLines.length > 0 ? report.summaryLines : ['기록이 더 쌓이면 주간 요약을 확인할 수 있어요.'];
  return (
    <>
      {lines.map((line) => (
        <p key={line} className="text-[14px] leading-[1.45] text-text-secondary">
          {line}
        </p>
      ))}
    </>
  );
}

function DailyBars({ trend }: { trend: DailyTrend[] }) {
  const max = Math.max(0, ...trend.map((d) => d.behaviorCount));
  const summary = trend.map((d) => `${weekdayLabel(fromDateKey(d.date))} ${d.behaviorCount}건`).join(', ');

  return (
    <div className="flex items-end justify-between" role="img" aria-label={`일별 도전 행동 수: ${summary}`}>
      {trend.map((d) => {
        const isTop = max > 0 && d.behaviorCount === max;
        const isZero = d.behaviorCount === 0;
        return (
          <div key={d.date} className="flex flex-col items-center gap-1.5" aria-hidden>
            <span className={`text-micro leading-none font-bold ${isTop ? 'text-primary-strong' : 'text-text-tertiary'}`}>
              {d.behaviorCount}
            </span>
            <span
              className={`w-6 rounded-t-[8px] rounded-b-[4px] ${
                isZero ? 'bg-line-base' : isTop ? 'bg-primary-strong' : 'bg-primary-base'
              }`}
              style={{ height: barHeight(d.behaviorCount, max) }}
            />
            <span className="text-micro leading-none font-medium text-text-secondary">
              {weekdayLabel(fromDateKey(d.date))}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/** Figma의 목록 카드: 관찰된 행동 패턴 + 새로 반영된 정보. TODO(B): ListRow로 교체 */
function PatternAndChanges({ report }: { report: WeeklyReportData }) {
  const topBehavior = report.repeatedBehaviors[0];
  const topSlot = report.timePattern[0];
  if (!topBehavior && report.keyChanges.length === 0) return null;

  return (
    <ul className="flex flex-col rounded-card bg-bg-surface px-4 py-0.5">
      {topBehavior && (
        <li className={report.keyChanges.length > 0 ? 'border-b border-line-base' : ''}>
          <div className="flex flex-col gap-1 py-4 leading-[1.45]">
            <span className="text-body-lg font-bold text-text-primary">관찰된 행동 패턴</span>
            <span className="text-[14px] text-text-secondary">
              {topBehavior.label} {topBehavior.count}회
              {topSlot ? ` · 주로 ${timeSlotLabel(topSlot.timeSlot)}` : ''}
            </span>
          </div>
        </li>
      )}
      {report.keyChanges.map((change, i) => (
        <li
          key={`${change.diaryId}-${change.content}`}
          className={i < report.keyChanges.length - 1 ? 'border-b border-line-base' : ''}
        >
          <KeyChangeRow change={change} isFirst={i === 0} />
        </li>
      ))}
    </ul>
  );
}

function KeyChangeRow({ change, isFirst }: { change: KeyChange; isFirst: boolean }) {
  return (
    <Link href={`/diary/${change.diaryId}/review`} className="flex items-center gap-3 py-4 active:opacity-80">
      <span className="flex min-w-0 flex-1 flex-col gap-1 leading-[1.45]">
        {isFirst && <span className="text-caption font-bold text-text-tertiary">새로 반영된 정보</span>}
        <span className="text-body-lg font-bold text-text-primary">{change.content}</span>
        <span className="text-[14px] text-text-secondary">
          {SECTION_LABEL[change.section] ?? change.section} · {formatMonthDay(fromDateKey(change.diaryDate))}
        </span>
      </span>
      <ChevronRightIcon size={20} className="shrink-0 text-text-tertiary" />
    </Link>
  );
}

/** 인터넷 끊김·시간 초과는 그 안내를, 그 밖에는 기획 확정안 문구 */
function reportErrorMessage(error: unknown) {
  if (error instanceof ApiError && (error.code === CLIENT_ERROR.NETWORK || error.code === CLIENT_ERROR.TIMEOUT)) {
    return getErrorMessage(error);
  }
  return '주간 리포트를 불러오지 못했어요.';
}

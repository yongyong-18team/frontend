// src/components/report/WeeklyReport.tsx
// 2.5 주간 돌봄 리포트 (Figma 35:3004)
//   - 요약 카드: 이 주에 기록한 날 수 + 한 줄
//   - 일별 도전 행동 막대 그래프 (월~일, 가장 많은 날은 진한 색)
//   - 주요 변화 목록
//   - "리포트 공유하기" → B의 공유 화면 (/share?documentType=WEEKLY&periodStart=…)
//
// 개발 중 "기록 없는 주"는 /report?periodStart=2000-01-03 으로 확인

'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import Button from '@/components/common/Button';
import { EmptyState, ErrorState, LoadingState } from '@/components/common/StateView';
import DiaryPageShell from '@/components/diary/DiaryPageShell';
import { ChevronRightIcon } from '@/components/icons/Icons';
import { useWeeklyReport } from '@/hooks/useWeeklyReport';
import type { DailyCount, ReportInsight } from '@/lib/api/report';
import { formatMonthDay, fromDateKey, isThisWeek, weekdayLabel } from '@/lib/date';

const TITLE = '주간 돌봄 리포트';

// TODO: 주요 변화 줄을 눌렀을 때 갈 화면 확정. 지금은 반영된 내용이 모이는 3.1 돌봄 설명서(B)
const INSIGHT_PATH = '/manual';

/** 막대 최대 높이 78px, 0건은 6px 회색 막대 (Figma 기준) */
const BAR_MAX = 78;
const BAR_EMPTY = 6;

export function barHeight(count: number, max: number) {
  if (count <= 0 || max <= 0) return BAR_EMPTY;
  return Math.max(BAR_EMPTY, Math.round((count / max) * BAR_MAX));
}

export default function WeeklyReport({ periodStart }: { periodStart?: string }) {
  const router = useRouter();
  const { state, retry } = useWeeklyReport(periodStart);

  const periodLabel =
    state.phase === 'done'
      ? `${formatMonthDay(fromDateKey(state.report.periodStart))} ~ ${formatMonthDay(
          fromDateKey(state.report.periodEnd),
        )}`
      : ' '; // 불러오는 동안 줄 높이 유지

  if (state.phase === 'loading') {
    return (
      <DiaryPageShell title={TITLE} desc={periodLabel}>
        <div className="mt-2">
          <LoadingState count={3} label="리포트를 불러오는 중이에요" />
        </div>
      </DiaryPageShell>
    );
  }

  if (state.phase === 'error') {
    return (
      <DiaryPageShell title={TITLE} desc={periodLabel}>
        <div className="mt-[34px]">
          <ErrorState message="리포트를 불러오지 못했어요" onRetry={retry} />
        </div>
      </DiaryPageShell>
    );
  }

  const { report } = state;

  // 기록 없는 주 (Figma 없음)
  if (report.recordedDays === 0) {
    return (
      <DiaryPageShell title={TITLE} desc={periodLabel}>
        <div className="mt-[34px]">
          <EmptyState
            title="이 주에는 기록이 없어요"
            description={'기록이 쌓이면 반복된 행동과\n대처 경향을 정리해 드려요.'}
            actionLabel="기록하러 가기"
            onAction={() => router.push('/diary/new')}
          />
        </div>
      </DiaryPageShell>
    );
  }

  const weekWord = isThisWeek(fromDateKey(report.periodStart), new Date()) ? '이번 주' : '이 주에';
  const shareHref = `/share?documentType=WEEKLY&periodStart=${report.periodStart}`;

  return (
    <DiaryPageShell title={TITLE} desc={periodLabel}>
      <div className="mt-2 flex flex-col gap-3">
        {/* 기록 요약 */}
        <section className="flex flex-col gap-1 rounded-card bg-primary-soft px-[18px] py-4">
          <p className="text-heading font-bold text-text-primary">
            {weekWord} {report.recordedDays}일 기록했어요
          </p>
          {report.highlight && (
            <p className="text-[14px] leading-[1.45] text-text-secondary">{report.highlight}</p>
          )}
        </section>

        {/* 일별 도전 행동 기록 */}
        <section className="flex flex-col gap-3 rounded-card bg-bg-surface px-[18px] py-4">
          <h2 className="text-body leading-[1.45] font-bold text-text-primary">일별 도전 행동 기록</h2>
          <DailyBars daily={report.daily} />
        </section>

        {/* 주요 변화 */}
        {report.insights.length > 0 && (
          <ul className="flex flex-col rounded-card bg-bg-surface px-4 py-0.5">
            {report.insights.map((insight, i) => (
              <li
                key={insight.id}
                className={i < report.insights.length - 1 ? 'border-b border-line-base' : ''}
              >
                <InsightRow insight={insight} />
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-auto pt-6">
        <Button onClick={() => router.push(shareHref)}>리포트 공유하기</Button>
      </div>
    </DiaryPageShell>
  );
}

function DailyBars({ daily }: { daily: DailyCount[] }) {
  const max = Math.max(0, ...daily.map((d) => d.count));
  const summary = daily
    .map((d) => `${weekdayLabel(fromDateKey(d.date))} ${d.count}건`)
    .join(', ');

  return (
    <div className="flex items-end justify-between" role="img" aria-label={`일별 도전 행동 수: ${summary}`}>
      {daily.map((d) => {
        const isTop = max > 0 && d.count === max;
        const isZero = d.count === 0;
        return (
          <div key={d.date} className="flex flex-col items-center gap-1.5" aria-hidden>
            <span
              className={`text-micro leading-none font-bold ${isTop ? 'text-primary-strong' : 'text-text-tertiary'}`}
            >
              {d.count}
            </span>
            <span
              className={`w-6 rounded-t-[8px] rounded-b-[4px] ${
                isZero ? 'bg-line-base' : isTop ? 'bg-primary-strong' : 'bg-primary-base'
              }`}
              style={{ height: barHeight(d.count, max) }}
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

/** TODO: B의 ListRow(Figma 34:1730)와 같은 모양이면 교체 */
function InsightRow({ insight }: { insight: ReportInsight }) {
  return (
    <Link href={INSIGHT_PATH} className="flex items-center gap-3 py-4 active:opacity-80">
      <span className="flex min-w-0 flex-1 flex-col gap-1 leading-[1.45]">
        <span className="text-body-lg font-bold text-text-primary">{insight.title}</span>
        <span className="text-[14px] text-text-secondary">{insight.summary}</span>
      </span>
      <ChevronRightIcon size={20} className="shrink-0 text-text-tertiary" />
    </Link>
  );
}

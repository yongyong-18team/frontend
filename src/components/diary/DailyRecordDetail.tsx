// src/components/diary/DailyRecordDetail.tsx
// 2.4 일일 기록 상세 — 공동 관리자(CO) 화면 (REPORT-02)
// - 그날 설명서에 반영된 항목만, 설명서 섹션별로 보여줌 (원문 없음, 보기만)
// - 아래 "이 기록 공유하기" → 4.1 일일 기록 공유 (PRD: 공동 관리자도 승인된 일일 기록 공유 가능)
// TODO(디자인): Figma에 화면이 없어 2.2·2.3과 같은 틀(DiaryPageShell)에 섹션 카드로 둠

'use client';

import { useRouter } from 'next/navigation';

import { EmptyState, ErrorState, LoadingState } from '@/components/common/StateView';
import DiaryPageShell from '@/components/diary/DiaryPageShell';
import { SECTION_LABEL, timeSlotLabel } from '@/components/diary/category';
import { ShareDiaryButton } from '@/components/diary/ShareDiaryButton';
import { SectionIcon, SECTION_TONE, TONE_CLASS } from '@/components/icons/SectionIcons';
import { useLoad } from '@/hooks/useLoad';
import { ApiError, getErrorMessage } from '@/lib/api/client';
import { getDailyRecord, type DailyRecordItem } from '@/lib/api/dailyRecord';
import { formatKoreanDate, fromDateKey } from '@/lib/date';

const LIST_PATH = '/diary';
const DESC = '설명서에 반영된 내용이에요';

export default function DailyRecordDetail({ diaryId }: { diaryId: number }) {
  const router = useRouter();
  const { state, retry } = useLoad(() => getDailyRecord(diaryId));

  if (state.phase === 'loading') {
    return (
      <DiaryPageShell title="돌봄 기록" desc={DESC}>
        <div className="mt-3.5">
          <LoadingState count={2} label="정보를 불러오고 있어요." />
        </div>
      </DiaryPageShell>
    );
  }

  if (state.phase === 'error') {
    // 지워졌거나 반영된 항목이 없는 기록
    const notFound = state.error instanceof ApiError && state.error.status === 404;
    return (
      <DiaryPageShell title="돌봄 기록" desc={DESC}>
        <div className="mt-[34px]">
          {notFound ? (
            <EmptyState
              title="기록을 찾을 수 없어요"
              description="삭제됐거나 아직 반영된 내용이 없는 기록이에요."
              actionLabel="기록 목록으로"
              onAction={() => router.replace(LIST_PATH)}
            />
          ) : (
            <ErrorState message={getErrorMessage(state.error)} onRetry={retry} />
          )}
        </div>
      </DiaryPageShell>
    );
  }

  const { diaryDate, sections } = state.data;
  const nonEmpty = sections.filter((s) => s.items.length > 0);

  return (
    <DiaryPageShell title={formatKoreanDate(fromDateKey(diaryDate))} desc={DESC}>
      {nonEmpty.length === 0 ? (
        <div className="mt-[34px]">
          <EmptyState title="반영된 내용이 없어요" description="보호자가 설명서에 반영하면 여기에 보여요." />
        </div>
      ) : (
        <div className="mt-3.5 flex flex-col gap-3.5">
          {nonEmpty.map(({ section, items }) => {
            const tone = SECTION_TONE[section] ?? 'primary';
            return (
              <section key={section} className="flex flex-col gap-3 rounded-card bg-bg-surface px-4 py-4">
                <h2 className="flex items-center gap-2 text-body-lg leading-[1.45] font-bold text-text-primary">
                  <span className={`flex size-8 shrink-0 items-center justify-center rounded-full ${TONE_CLASS[tone]}`}>
                    <SectionIcon section={section} size={18} />
                  </span>
                  {SECTION_LABEL[section] ?? section}
                </h2>
                <ul className="flex flex-col gap-2.5">
                  {items.map((item, i) => (
                    <ItemRow key={i} item={item} />
                  ))}
                </ul>
              </section>
            );
          })}
          <ShareDiaryButton diaryId={state.data.diaryId} className="mt-3" />
        </div>
      )}
    </DiaryPageShell>
  );
}

function ItemRow({ item }: { item: DailyRecordItem }) {
  const meta = [timeSlotLabel(item.timeSlot), item.durationMin ? `약 ${item.durationMin}분` : '']
    .filter(Boolean)
    .join(' · ');
  return (
    <li className="flex flex-col gap-0.5 border-t border-line-base pt-2.5 first:border-t-0 first:pt-0">
      <p className="text-body leading-[1.5] text-text-primary">{item.content}</p>
      {meta && <p className="text-caption leading-[1.45] text-text-tertiary">{meta}</p>}
    </li>
  );
}

// src/components/diary/DiaryResult.tsx
// 2.2 AI 분석 결과 (DIARY-02 결과 기준)
//
// 상태별 화면
//   - 분석 중(요청 한 번, 최대 35초) → [예외] AI 분석 로딩 (Figma 35:2606)
//   - CRISIS                     → 5.5 위기 안내(/crisis)로 바로 이동 (일기는 저장됨)
//   - 실패(AI_TIMEOUT 등)          → [예외] AI 분석 실패 (Figma 35:2630) + 다시 시도
//   - NO_ITEMS                   → 추출 결과 없음 안내 (Figma 없음, B의 EmptyState)
//   - REVIEW                     → 기본 (Figma 35:2535)
//   - burnoutNotice: true        → 하단에 소진 지원 카드 → 5.4 (Figma 없음, 임시 디자인)
//
// 회색 따옴표 줄은 근거가 된 일기 원문(evidenceQuote)이라 고치지 않습니다. 문장 수정은 2.3에서.

'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import Button from '@/components/common/Button';
import Chip from '@/components/common/Chip';
import { EmptyState, ErrorState, LoadingState } from '@/components/common/StateView';
import { getItemChip } from '@/components/diary/category';
import DeleteDiaryButton from '@/components/diary/DeleteDiaryButton';
import DiaryPageShell from '@/components/diary/DiaryPageShell';
import { CoffeeIcon, QuoteIcon, SparkleIcon } from '@/components/icons/Icons';
import { useDiaryAnalysis } from '@/hooks/useDiaryAnalysis';
import { ApiError, CLIENT_ERROR, getErrorMessage } from '@/lib/api/client';
import type { DiaryItem } from '@/lib/api/diary';

const DIARY_LIST_PATH = '/diary';
// TODO(B): 5.4 소진 지원 안내 화면 주소 확인 (support/rest 로 예상)
const BURNOUT_SUPPORT_PATH = '/support/rest';

export default function DiaryResult({ diaryId }: { diaryId: number }) {
  const router = useRouter();
  const { state, retry } = useDiaryAnalysis(diaryId);

  const isCrisis = state.phase === 'done' && state.data.result === 'CRISIS';

  // 위기 판단이면 5.5로 이동 (뒤로가기로 이 화면에 다시 오지 않도록 replace)
  useEffect(() => {
    if (isCrisis) router.replace('/crisis');
  }, [isCrisis, router]);

  // [예외] AI 분석 로딩 (Figma 35:2606)
  if (state.phase === 'loading' || isCrisis) {
    return (
      <DiaryPageShell title="AI가 기록을 정리하고 있어요" desc="잠시만 기다려 주세요.">
        <div className="mt-1">
          <EmptyState
            icon={<SparkleIcon size={38} />}
            title="분석 중이에요"
            description={'보통 10초 안에 끝나요.\n화면을 나가도 기록은 저장돼요.'}
          />
        </div>
        <div className="mt-5">
          <LoadingState count={1} label="AI가 기록을 분석하고 있어요" />
        </div>
        <div className="mt-auto pt-6">
          <Button disabled>분석 중…</Button>
        </div>
      </DiaryPageShell>
    );
  }

  // [예외] AI 분석 실패 (Figma 35:2630)
  if (state.phase === 'error') {
    return (
      <DiaryPageShell title="AI 분석 결과" desc="오늘의 기록" right={<DeleteDiaryButton diaryId={diaryId} />}>
        <div className="mt-[34px] flex flex-col items-center">
          <ErrorState message="결과를 불러오지 못했어요." />
          {/* 인터넷 문제는 연결 안내, 그 밖에는 기획 확정안 문구 (TODO(B): ErrorState에 설명이 생기면 그쪽으로) */}
          <p className="-mt-2 text-center text-body leading-[1.55] whitespace-pre-line text-text-secondary">
            {isConnectionError(state.error) ? getErrorMessage(state.error) : '작성한 기록은 저장되어 있어요. 다시 시도해 주세요.'}
          </p>
        </div>
        <div className="mt-auto flex flex-col gap-3 pt-6">
          <Button onClick={retry}>다시 시도</Button>
          <Button variant="outline" onClick={() => router.push(DIARY_LIST_PATH)}>
            기록 목록으로 돌아가기
          </Button>
        </div>
      </DiaryPageShell>
    );
  }

  const { result, empathyText, items, burnoutNotice } = state.data;

  return (
    <DiaryPageShell title="AI가 돌봄 정보를 정리했어요" desc="확인 후 검토 단계로 이동해 주세요" right={<DeleteDiaryButton diaryId={diaryId} />}>
      <div className="mt-3.5 flex flex-col gap-3.5">
        {/* 오늘의 한마디 */}
        {empathyText && (
          <section className="flex flex-col gap-2 rounded-card bg-butter-soft px-[18px] py-4">
            <div className="flex items-center gap-2">
              <span className="flex size-7 items-center justify-center rounded-full bg-butter-base text-peach-strong">
                <SparkleIcon size={16} />
              </span>
              <span className="text-caption leading-[1.45] font-bold text-peach-strong">오늘의 한마디</span>
            </div>
            <p className="text-body-lg leading-[1.5] font-medium whitespace-pre-line text-text-primary">
              {empathyText}
            </p>
          </section>
        )}

        {result === 'REVIEW' ? (
          <>
            <div className="flex items-center gap-2">
              <h2 className="text-subhead font-bold text-text-primary">추출된 정보</h2>
              <Chip tone="primary">{items.length}건</Chip>
            </div>
            <ul className="flex flex-col gap-3.5">
              {items.map((item) => (
                <ExtractedCard key={item.itemNo} item={item} />
              ))}
            </ul>
          </>
        ) : (
          // NO_ITEMS: 추출 결과 없음 (Figma 없음)
          <EmptyState
            title="이번 기록에서는 새롭게 추가할 돌봄 정보를 찾지 못했어요."
            description="작성하신 일기는 저장됐어요."
          />
        )}

        {burnoutNotice && <BurnoutCard />}
      </div>

      <div className="mt-auto pt-6">
        {result === 'REVIEW' ? (
          <Button onClick={() => router.push(`/diary/${diaryId}/review`)}>추출 정보 검토하기</Button>
        ) : (
          <Button variant="outline" onClick={() => router.push(DIARY_LIST_PATH)}>
            기록 목록으로
          </Button>
        )}
      </div>
    </DiaryPageShell>
  );
}

function ExtractedCard({ item }: { item: DiaryItem }) {
  const chip = getItemChip(item);
  return (
    <li className="flex flex-col gap-2 rounded-card bg-bg-surface px-4 py-[14px]">
      <div>
        <Chip tone={chip.tone}>{chip.label}</Chip>
      </div>
      <p className="text-body-lg leading-[1.45] font-bold text-text-primary">{item.content}</p>
      {item.evidenceQuote && (
        <p className="flex items-center gap-1.5 text-caption leading-[1.45] text-text-tertiary">
          <QuoteIcon size={14} className="shrink-0" />
          <span className="min-w-0 flex-1 truncate">{item.evidenceQuote}</span>
        </p>
      )}
    </li>
  );
}

/** burnoutNotice: true → 5.4 소진 지원 안내 카드 (문구: 기획 확정안 v1.4, 디자인: Figma 없음 임시) */
function BurnoutCard() {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;
  return (
    <section className="flex flex-col gap-3 rounded-card bg-peach-soft px-4 py-[14px]" aria-label="보호자 휴식 지원 안내">
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-bg-surface text-peach-strong">
          <CoffeeIcon size={22} />
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-0.5 leading-[1.45]">
          <span className="text-body font-bold text-text-primary">요즘 기록에 지치신 날이 자주 보여요.</span>
          <span className="text-caption text-text-secondary">보호자가 쉴 수 있도록 돕는 제도가 있어요.</span>
        </span>
      </div>
      <div className="flex gap-2">
        {/* 나중에 확인: 이 화면에서만 닫음 (다시 안내하는 주기는 서버가 14일로 관리) */}
        <Button variant="outline" className="flex-1" onClick={() => setDismissed(true)}>
          나중에 확인
        </Button>
        <Link
          href={BURNOUT_SUPPORT_PATH}
          className="flex h-14 flex-1 items-center justify-center rounded-button bg-primary-strong text-body-lg font-bold text-text-on-primary"
        >
          지원제도 확인
        </Link>
      </div>
    </section>
  );
}

/** 인터넷 끊김·시간 초과인지 */
function isConnectionError(error: unknown) {
  return error instanceof ApiError && (error.code === CLIENT_ERROR.NETWORK || error.code === CLIENT_ERROR.TIMEOUT);
}

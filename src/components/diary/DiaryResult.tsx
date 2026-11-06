// src/components/diary/DiaryResult.tsx
// 2.2 AI 분석 결과
//
// 상태별 화면
//   - 분석 중              → [예외] AI 분석 로딩 (Figma 35:2606), 자동으로 계속 조회
//   - 위기 판단            → 5.5 위기 안내(/crisis)로 바로 이동
//   - 실패·시간 초과·연결 오류 → [예외] AI 분석 실패 (Figma 35:2630)
//   - 완료, 추출 정보 0건    → 안내 (Figma 없음, B의 EmptyState 사용)
//   - 완료                → 기본 (Figma 35:2535)
//
// 로딩·오류·빈 상태 그림은 B의 공통 StateView를 씁니다.

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import Button from '@/components/common/Button';
import Chip from '@/components/common/Chip';
import { EmptyState, ErrorState, LoadingState } from '@/components/common/StateView';
import { getCategory } from '@/components/diary/category';
import DiaryPageShell from '@/components/diary/DiaryPageShell';
import ItemDetailDialog from '@/components/diary/ItemDetailDialog';
import { QuoteIcon, SparkleIcon } from '@/components/icons/Icons';
import { useDiaryAnalysis } from '@/hooks/useDiaryAnalysis';
import { getItemDetail, updateItemDetail, type ExtractedItem } from '@/lib/api/diary';

// 2.4 기록 목록
const DIARY_LIST_PATH = '/diary';

export default function DiaryResult({ diaryId }: { diaryId: string }) {
  const router = useRouter();
  const { state, retry } = useDiaryAnalysis(diaryId);
  // 팝업에서 저장한 자세한 내용 (화면에 바로 보이도록 따로 보관)
  const [savedDetails, setSavedDetails] = useState<Record<string, string>>({});
  const [openItem, setOpenItem] = useState<ExtractedItem | null>(null);

  const isCrisis = state.phase === 'done' && state.data.riskLevel === 'CRISIS';

  // 위기 판단이면 5.5로 이동 (뒤로가기로 이 화면에 다시 오지 않도록 replace)
  useEffect(() => {
    if (isCrisis) router.replace('/crisis');
  }, [isCrisis, router]);

  // [예외] AI 분석 로딩 (Figma 35:2606)
  if (state.phase === 'loading' || isCrisis) {
    return (
      <DiaryPageShell title="AI가 기록을 정리하고 있어요" desc="잠시만 기다려 주세요">
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

  // [예외] AI 분석 실패 (Figma 35:2630) — 실패·시간 초과·연결 오류 모두 이 화면
  if (state.phase === 'error') {
    return (
      <DiaryPageShell title="AI 분석 결과" desc="오늘의 기록">
        <div className="mt-[34px]">
          {/* TODO(B): ErrorState에 설명(description)이 생기면 추가
              "네트워크 상태를 확인한 뒤 다시 시도해 주세요.\n작성한 기록은 안전하게 저장되어 있어요." */}
          <ErrorState message="결과를 불러오지 못했어요" />
        </div>

        {/* 디자인상 버튼은 아래쪽에 두 개라서 ErrorState의 onRetry 대신 직접 배치 */}
        <div className="mt-auto flex flex-col gap-3 pt-6">
          {/* TODO(백엔드 B): 분석 자체가 실패(FAILED)했을 때 다시 분석을 요청하는 API가 있으면 그걸 호출 */}
          <Button onClick={retry}>다시 시도</Button>
          <Button variant="outline" onClick={() => router.push(DIARY_LIST_PATH)}>
            기록 목록으로 돌아가기
          </Button>
        </div>
      </DiaryPageShell>
    );
  }

  const { empathyMessage } = state.data;
  // 저장한 자세한 내용을 덮어씌운 항목 목록
  const items = state.data.items.map((item) =>
    item.id in savedDetails ? { ...item, detail: savedDetails[item.id] } : item,
  );

  const saveDetail = async (detail: string) => {
    if (!openItem) return;
    await updateItemDetail(diaryId, openItem.id, detail);
    setSavedDetails((prev) => ({ ...prev, [openItem.id]: detail }));
  };

  return (
    <DiaryPageShell title="AI가 돌봄 정보를 정리했어요" desc="확인 후 검토 단계로 이동해 주세요">
      <div className="mt-3.5 flex flex-col gap-3.5">
        {/* 오늘의 한마디 */}
        {empathyMessage && (
          <section className="flex flex-col gap-2 rounded-card bg-butter-soft px-[18px] py-4">
            <div className="flex items-center gap-2">
              <span className="flex size-7 items-center justify-center rounded-full bg-butter-base text-peach-strong">
                <SparkleIcon size={16} />
              </span>
              <span className="text-caption leading-[1.45] font-bold text-peach-strong">오늘의 한마디</span>
            </div>
            <p className="text-body-lg leading-[1.5] font-medium whitespace-pre-line text-text-primary">
              {empathyMessage}
            </p>
          </section>
        )}

        {/* 추출된 정보 */}
        <div className="flex items-center gap-2">
          <h2 className="text-subhead font-bold text-text-primary">추출된 정보</h2>
          <Chip tone="primary">{items.length}건</Chip>
        </div>

        {items.length > 0 ? (
          <ul className="flex flex-col gap-3.5">
            {items.map((item) => (
              <ExtractedCard key={item.id} item={item} onOpenDetail={() => setOpenItem(item)} />
            ))}
          </ul>
        ) : (
          // Figma 없음: 분석은 성공했지만 추출된 정보가 0건일 때
          <EmptyState
            title="정리할 정보가 없었어요"
            description={'언제, 어떤 상황에서, 어떻게 대처했는지\n적어 주시면 더 잘 정리해 드려요.'}
            actionLabel="기록 다시 쓰기"
            onAction={() => router.back()}
          />
        )}
      </div>

      {items.length > 0 && (
        <div className="mt-auto pt-6">
          <Button onClick={() => router.push(`/diary/${diaryId}/review`)}>추출 정보 검토하기</Button>
        </div>
      )}

      <ItemDetailDialog item={openItem} onClose={() => setOpenItem(null)} onSave={saveDetail} />
    </DiaryPageShell>
  );
}

function ExtractedCard({ item, onOpenDetail }: { item: ExtractedItem; onOpenDetail: () => void }) {
  const category = getCategory(item.category);
  return (
    <li className="flex flex-col gap-2 rounded-card bg-bg-surface px-4 py-[14px]">
      <div>
        <Chip tone={category.tone}>{category.label}</Chip>
      </div>
      <p className="text-body-lg leading-[1.45] font-bold text-text-primary">{item.summary}</p>
      {/* 따옴표 줄: 누르면 자세한 내용 팝업 */}
      <button
        type="button"
        onClick={onOpenDetail}
        aria-label={`${item.summary} 자세한 내용 보기·쓰기`}
        className="-mx-1 -my-0.5 flex items-center gap-1.5 rounded-lg px-1 py-0.5 text-left text-caption leading-[1.45] text-text-tertiary active:bg-bg-subtle"
      >
        <QuoteIcon size={14} />
        <span className="min-w-0 flex-1 truncate">{getItemDetail(item)}</span>
      </button>
    </li>
  );
}

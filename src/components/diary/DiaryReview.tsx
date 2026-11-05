// src/components/diary/DiaryReview.tsx
// 2.3 분석 정보 승인
//   - 기본 (Figma 35:2710): 승인 1 · 검토 대기 1 → "설명서에 반영하기"
//   - [예외] 승인·제외 상태 (Figma 35:2780): 승인 1 · 제외 1 → "승인한 1개 항목 반영하기"
//
// 처음 검토하는 기록은 모든 항목이 "검토 대기"로 시작하고,
// 2.4 목록에서 다시 연 기록은 지난번에 고른 승인·제외 상태로 시작합니다.
// 검토 대기 항목이 남은 채로 반영하면 확인 팝업을 띄우고, 검토 대기 항목은 반영하지 않습니다.

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import Button from '@/components/common/Button';
import Chip from '@/components/common/Chip';
import { Modal } from '@/components/common/Overlay';
import { ErrorState, LoadingState } from '@/components/common/StateView';
import DiaryPageShell from '@/components/diary/DiaryPageShell';
import ItemDetailDialog from '@/components/diary/ItemDetailDialog';
import ReviewItemCard, { type ReviewStatus } from '@/components/diary/ReviewItemCard';
import { useDiaryAnalysis } from '@/hooks/useDiaryAnalysis';
import {
  getItemDetail,
  submitDiaryReview,
  type ExtractedItem,
  type ReviewDecision,
} from '@/lib/api/diary';

// 반영이 끝나면 2.4 기록 목록으로
const AFTER_SUBMIT_PATH = '/diary';

const TITLE = '설명서 반영 여부를 선택하세요';
const DESC = '내용을 수정하거나 제외할 수 있어요';

export default function DiaryReview({ diaryId }: { diaryId: string }) {
  const router = useRouter();
  const { state, retry } = useDiaryAnalysis(diaryId);

  const isCrisis = state.phase === 'done' && state.data.riskLevel === 'CRISIS';
  useEffect(() => {
    if (isCrisis) router.replace('/crisis');
  }, [isCrisis, router]);

  if (state.phase === 'loading' || isCrisis) {
    return (
      <DiaryPageShell title={TITLE} desc={DESC}>
        <div className="mt-3.5">
          <LoadingState count={2} label="추출된 정보를 불러오는 중이에요" />
        </div>
      </DiaryPageShell>
    );
  }

  if (state.phase === 'error') {
    return (
      <DiaryPageShell title={TITLE} desc={DESC}>
        <div className="mt-[34px]">
          <ErrorState message="추출된 정보를 불러오지 못했어요" onRetry={retry} />
        </div>
      </DiaryPageShell>
    );
  }

  // 데이터가 준비된 뒤에만 검토 상태를 만들도록 분리
  return <ReviewForm diaryId={diaryId} items={state.data.items} onDone={() => router.push(AFTER_SUBMIT_PATH)} />;
}

// detail: 2.2에서 저장한 자세한 내용(없으면 일기 원문)으로 시작, "수정" 팝업에서 바뀜
type ItemState = { status: ReviewStatus; detail: string };

function ReviewForm({
  diaryId,
  items,
  onDone,
}: {
  diaryId: string;
  items: ExtractedItem[];
  onDone: () => void;
}) {
  const [review, setReview] = useState<Record<string, ItemState>>(() =>
    Object.fromEntries(
      items.map((item) => [item.id, { status: item.reviewStatus ?? 'PENDING', detail: getItemDetail(item) }]),
    ),
  );
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitFailed, setSubmitFailed] = useState(false);

  const update = (id: string, patch: Partial<ItemState>) =>
    setReview((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));

  // 팝업에 넘길 항목: 지금까지 고친 자세한 내용을 반영
  const editingItem = editingId
    ? (() => {
        const item = items.find((i) => i.id === editingId);
        return item ? { ...item, detail: review[editingId].detail } : null;
      })()
    : null;

  const counts = { APPROVED: 0, PENDING: 0, EXCLUDED: 0 };
  for (const item of Object.values(review)) counts[item.status] += 1;

  const submit = async () => {
    setSubmitting(true);
    setSubmitFailed(false);
    const decisions: ReviewDecision[] = items
      .filter((item) => review[item.id].status !== 'PENDING')
      .map((item) => ({
        itemId: item.id,
        status: review[item.id].status as ReviewDecision['status'],
        detail: review[item.id].detail,
      }));
    try {
      await submitDiaryReview(diaryId, decisions);
      onDone();
    } catch {
      setSubmitFailed(true);
      setSubmitting(false);
      setConfirmOpen(false);
    }
  };

  const handleSubmitClick = () => {
    if (counts.PENDING > 0) setConfirmOpen(true);
    else submit();
  };

  // 버튼 문구: 검토 대기가 남아 있으면 일반 문구, 다 검토했으면 반영 개수 표시 (Figma 기준)
  const submitLabel = submitting
    ? '반영하는 중…'
    : counts.APPROVED === 0
      ? '승인한 항목이 없어요'
      : counts.PENDING > 0
        ? '설명서에 반영하기'
        : `승인한 ${counts.APPROVED}개 항목 반영하기`;

  return (
    <DiaryPageShell title={TITLE} desc={DESC}>
      <ul className="mt-3.5 flex flex-col gap-3.5">
        {items.map((item) => (
          <ReviewItemCard
            key={item.id}
            item={item}
            status={review[item.id].status}
            disabled={submitting}
            onStatusChange={(status) => update(item.id, { status })}
            onEdit={() => setEditingId(item.id)}
          />
        ))}
      </ul>

      <div className="mt-auto pt-6">
        {/* 요약: 0인 항목은 숨김 */}
        <div className="flex gap-2" aria-live="polite">
          {counts.APPROVED > 0 && <Chip tone="mint">승인 {counts.APPROVED}</Chip>}
          {counts.PENDING > 0 && <Chip tone="peach">검토 대기 {counts.PENDING}</Chip>}
          {counts.EXCLUDED > 0 && <Chip tone="pink">제외 {counts.EXCLUDED}</Chip>}
        </div>

        {submitFailed && (
          <p className="mt-2 text-caption text-pink-strong" role="alert">
            반영하지 못했어요. 잠시 후 다시 시도해 주세요.
          </p>
        )}

        <Button
          className="mt-3.5"
          onClick={handleSubmitClick}
          disabled={submitting || counts.APPROVED === 0}
        >
          {submitLabel}
        </Button>
      </div>

      {/* 수정: 자세한 내용 팝업 (2.2와 같은 팝업). 여기서는 반영할 때 함께 보냄 */}
      <ItemDetailDialog
        item={editingItem}
        onClose={() => setEditingId(null)}
        onSave={(detail) => {
          if (editingId) update(editingId, { detail });
        }}
      />

      {/* 검토 대기 항목이 남은 채 반영을 누르면 확인 */}
      <Modal
        open={confirmOpen}
        title={`검토하지 않은 항목이 ${counts.PENDING}개 있어요`}
        message={
          <>
            검토 대기 항목은 설명서에 반영되지 않아요.
            <br />
            승인한 {counts.APPROVED}개만 반영할까요?
          </>
        }
        cancelLabel="계속 검토"
        confirmLabel="반영하기"
        loading={submitting}
        onConfirm={submit}
        onClose={() => setConfirmOpen(false)}
      />
    </DiaryPageShell>
  );
}

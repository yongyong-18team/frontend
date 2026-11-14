// src/components/diary/DiaryReview.tsx
// 2.3 분석 정보 승인 (DIARY-04로 불러오고 ITEM-01로 반영)
//   - 기본 (Figma 35:2710): 승인 1 · 검토 대기 1 → "설명서에 반영하기"
//   - [예외] 승인·제외 상태 (Figma 35:2780): 승인 1 · 제외 1 → "승인한 1개 항목 반영하기"
//
// - 항목은 서버 상태(PENDING·APPROVED·EXCLUDED)로 시작 → 2.4에서 다시 열어도 지난 결과가 보임
// - "수정"은 항목 문장을 고쳐서 승인 (ITEM-01의 content)
// - 바뀐 항목만 보냄. 바뀐 게 하나라도 있으면 반영 가능 (이미 승인한 항목을 제외로 바꾸는 것도 포함)
// - 이미 승인·제외한 항목은 검토 대기로 되돌릴 수 없음 (명세에 PENDING 요청이 없음) → 승인/제외로만 바꿈
// - 검토 대기 항목이 남은 채로 반영하면 확인 팝업 → 검토 대기 항목은 그대로 남음
// - 바꾼 내용이 있는데 뒤로가기 → "저장하지 않고 나가시겠어요?" (기획 문구 확정안 v1.4)
// - 오른쪽 위 "삭제" → DIARY-05
// - 오른쪽 위 "공유" → 4.1 일일 기록 공유 (이미 승인된 항목이 있을 때만. 공유는 승인 정보만 사용)

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import Button from '@/components/common/Button';
import Chip from '@/components/common/Chip';
import { Modal } from '@/components/common/Overlay';
import { EmptyState, ErrorState, LoadingState } from '@/components/common/StateView';
import DiaryPageShell from '@/components/diary/DiaryPageShell';
import DeleteDiaryButton from '@/components/diary/DeleteDiaryButton';
import { ShareDiaryButton } from '@/components/diary/ShareDiaryButton';
import ItemEditDialog from '@/components/diary/ItemEditDialog';
import ReviewItemCard from '@/components/diary/ReviewItemCard';
import { useDiaryDetail } from '@/hooks/useDiaryDetail';
import { ApiError, CLIENT_ERROR, getErrorMessage } from '@/lib/api/client';
import { reviewDiaryItems, type DiaryItem, type ItemStatus, type ReviewDecision } from '@/lib/api/diary';

// 반영이 끝나면 2.4 기록 목록으로 (목록에서 "반영됐어요" 안내)
const AFTER_SUBMIT_PATH = '/diary?done=reflected';
const DIARY_LIST_PATH = '/diary';

const TITLE = '설명서 반영 여부를 선택하세요';
const DESC = '내용을 수정하거나 제외할 수 있어요';

export default function DiaryReview({ diaryId }: { diaryId: number }) {
  const router = useRouter();
  const { state, retry } = useDiaryDetail(diaryId);

  // 아직 분석 전인 일기면 2.2에서 분석부터
  const notAnalyzed = state.phase === 'done' && state.detail.analysisStatus !== 'DONE';
  useEffect(() => {
    if (notAnalyzed) router.replace(`/diary/${diaryId}/result`);
  }, [notAnalyzed, diaryId, router]);

  if (state.phase === 'loading' || notAnalyzed) {
    return (
      <DiaryPageShell title={TITLE} desc={DESC}>
        <div className="mt-3.5">
          <LoadingState count={2} label="정보를 불러오고 있어요." />
        </div>
      </DiaryPageShell>
    );
  }

  if (state.phase === 'error') {
    return (
      <DiaryPageShell title={TITLE} desc={DESC}>
        <div className="mt-[34px]">
          <ErrorState message={getErrorMessage(state.error)} onRetry={retry} />
        </div>
      </DiaryPageShell>
    );
  }

  if (state.detail.items.length === 0) {
    return (
      <DiaryPageShell title={TITLE} desc={DESC} right={<DeleteDiaryButton diaryId={diaryId} />}>
        <div className="mt-[34px]">
          <EmptyState
            title="검토할 항목이 없어요"
            description="이 기록에서는 정리된 정보가 없었어요."
            actionLabel="기록 목록으로"
            onAction={() => router.push(DIARY_LIST_PATH)}
          />
        </div>
      </DiaryPageShell>
    );
  }

  // 데이터가 준비된 뒤에만 검토 상태를 만들도록 분리
  return (
    // key: 다시 불러온 내용이 바뀌면(반영 후 돌아온 경우 등) 검토 상태를 새로 시작
    <ReviewForm
      key={state.detail.items.map((i) => `${i.itemNo}:${i.status}:${i.content}`).join('|')}
      diaryId={diaryId}
      items={state.detail.items}
      onDone={() => router.push(AFTER_SUBMIT_PATH)}
    />
  );
}

type ItemState = { status: ItemStatus; content: string };

function ReviewForm({ diaryId, items, onDone }: { diaryId: number; items: DiaryItem[]; onDone: () => void }) {
  const [review, setReview] = useState<Record<number, ItemState>>(() =>
    Object.fromEntries(items.map((item) => [item.itemNo, { status: item.status, content: item.content }])),
  );
  const [editingNo, setEditingNo] = useState<number | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const router = useRouter();

  // 반영 후 목록으로 갔다가 뒤로가기로 돌아오면 "반영하는 중…"에 멈춰 있지 않게 (Next.js 16이 화면 상태를 보관함)
  useEffect(() => {
    return () => {
      setSubmitting(false);
      setConfirmOpen(false);
      setLeaveOpen(false);
    };
  }, []);

  const update = (itemNo: number, patch: Partial<ItemState>) =>
    setReview((prev) => ({ ...prev, [itemNo]: { ...prev[itemNo], ...patch } }));

  // 서버 상태와 달라진 항목만 보냄 (검토 대기로 되돌린 항목은 보낼 수 없음)
  const decisions = items.flatMap((item): ReviewDecision[] => {
    const now = review[item.itemNo];
    if (now.status === 'PENDING') return [];
    const contentChanged = now.content !== item.content;
    if (now.status === item.status && !contentChanged) return [];
    if (now.status === 'EXCLUDED') return [{ itemNo: item.itemNo, status: 'EXCLUDED' }];
    return [{ itemNo: item.itemNo, status: 'APPROVED', ...(contentChanged ? { content: now.content } : {}) }];
  });
  const approvingCount = decisions.filter((d) => d.status === 'APPROVED').length;

  const counts = { APPROVED: 0, PENDING: 0, EXCLUDED: 0 };
  for (const item of Object.values(review)) counts[item.status] += 1;

  const editingItem =
    editingNo === null
      ? null
      : (() => {
          const item = items.find((i) => i.itemNo === editingNo);
          return item ? { ...item, content: review[editingNo].content } : null;
        })();

  const submit = async () => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      await reviewDiaryItems(diaryId, decisions);
      // TODO: duplicateSkippedCount(이미 설명서에 있던 항목 수)를 목록 화면에 안내할지 디자인 확인
      onDone();
    } catch (e) {
      // 인터넷 문제·"하나 이상 선택" 같은 안내는 서버 문구, 그 밖에는 기획 확정안 문구
      const keepServerMessage =
        e instanceof ApiError &&
        (e.code === CLIENT_ERROR.NETWORK || e.code === CLIENT_ERROR.TIMEOUT || e.code === 'GUIDE_NOTHING_TO_APPLY');
      setSubmitError(keepServerMessage ? getErrorMessage(e) : '정보를 반영하지 못했어요. 다시 시도해 주세요.');
      setSubmitting(false);
      setConfirmOpen(false);
    }
  };

  const handleSubmitClick = () => {
    if (counts.PENDING > 0) setConfirmOpen(true);
    else submit();
  };

  const canSubmit = decisions.length > 0 && !submitting;
  const submitLabel = submitting
    ? '반영하는 중…'
    : approvingCount > 0 && counts.PENDING === 0
      ? `승인한 ${approvingCount}개 항목 반영하기`
      : '설명서에 반영하기';
  // 버튼이 꺼져 있는 이유 (기획 확정안 "선택 없음")
  const disabledReason = submitting || canSubmit ? null : counts.PENDING > 0 ? '반영할 정보를 선택해 주세요.' : '바뀐 내용이 없어요.';

  // 바꾼 내용이 있으면 나가기 전에 확인
  const hasChanges = decisions.length > 0 || items.some((item) => review[item.itemNo].status !== item.status);
  const handleBack = () => {
    if (hasChanges && !submitting) setLeaveOpen(true);
    else router.back();
  };
  useEffect(() => {
    if (!hasChanges) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [hasChanges]);

  return (
    <DiaryPageShell
      title={TITLE}
      desc={DESC}
      onBack={handleBack}
      right={<DeleteDiaryButton diaryId={diaryId} />}
    >
      <ul className="mt-3.5 flex flex-col gap-3.5">
        {items.map((item) => {
          const now = review[item.itemNo];
          return (
            <ReviewItemCard
              key={item.itemNo}
              item={item}
              status={now.status}
              content={now.content}
              edited={now.content !== item.content || !!item.edited}
              disabled={submitting}
              // 서버에서 이미 승인·제외된 항목은 검토 대기로 못 돌림
              canUnapprove={item.status === 'PENDING'}
              onStatusChange={(status) => update(item.itemNo, { status })}
              onEdit={() => setEditingNo(item.itemNo)}
            />
          );
        })}
      </ul>

      <div className="mt-auto pt-6">
        {/* 요약: 0인 항목은 숨김 */}
        <div className="flex gap-2" aria-live="polite">
          {counts.APPROVED > 0 && <Chip tone="mint">승인됨 {counts.APPROVED}</Chip>}
          {counts.PENDING > 0 && <Chip tone="peach">검토 대기 {counts.PENDING}</Chip>}
          {counts.EXCLUDED > 0 && <Chip tone="pink">제외됨 {counts.EXCLUDED}</Chip>}
        </div>

        {submitError && (
          <p className="mt-2 text-caption text-pink-strong" role="alert">
            {submitError}
          </p>
        )}

        {disabledReason && !submitError && <p className="mt-2 text-caption text-text-tertiary">{disabledReason}</p>}

        <Button className="mt-3.5" onClick={handleSubmitClick} disabled={!canSubmit}>
          {submitLabel}
        </Button>
        {/* 일일 기록 공유: 서버에 이미 승인된 항목이 있을 때만 (공유는 승인 정보만 사용) */}
        {items.some((item) => item.status === 'APPROVED') && <ShareDiaryButton diaryId={diaryId} className="mt-2.5" />}
      </div>

      {/* 수정: 항목 문장 고치기 → 승인 상태로 바꿈 (수정 후 승인) */}
      <ItemEditDialog
        item={editingItem}
        onClose={() => setEditingNo(null)}
        onSave={(content) => {
          if (editingNo !== null) update(editingNo, { content, status: 'APPROVED' });
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
            {approvingCount > 0 ? `승인한 ${approvingCount}개만 반영할까요?` : '바꾼 내용만 저장할까요?'}
          </>
        }
        cancelLabel="계속 검토"
        confirmLabel="반영하기"
        loading={submitting}
        onConfirm={submit}
        onClose={() => setConfirmOpen(false)}
      />

      {/* 바꾼 내용이 있는데 뒤로가기 */}
      <Modal
        open={leaveOpen}
        title="저장하지 않고 나가시겠어요?"
        message="바꾼 내용은 설명서에 반영되지 않아요."
        cancelLabel="계속 수정하기"
        confirmLabel="나가기"
        onConfirm={() => {
          setLeaveOpen(false);
          router.back();
        }}
        onClose={() => setLeaveOpen(false)}
      />
    </DiaryPageShell>
  );
}

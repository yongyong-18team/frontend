// src/components/diary/DeleteDiaryButton.tsx
// 기록 삭제 (DIARY-05) — 2.2·2.3 오른쪽 위 "삭제"
// 문구: 기획 문구 확정안 v1.4 '2.4 기록 삭제'
// TODO(디자인): Figma에 삭제 버튼 위치가 없어 일기 상세(2.2·2.3) 오른쪽 위에 임시로 둠

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { Modal } from '@/components/common/Overlay';
import { ApiError, CLIENT_ERROR, getErrorMessage } from '@/lib/api/client';
import { deleteDiary } from '@/lib/api/diary';

export default function DeleteDiaryButton({ diaryId }: { diaryId: number }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    setDeleting(true);
    setError(null);
    try {
      await deleteDiary(diaryId);
      // 2.4 목록에서 "돌봄 기록이 삭제됐어요." 안내
      router.replace('/diary?done=deleted');
    } catch (e) {
      const connection = e instanceof ApiError && (e.code === CLIENT_ERROR.NETWORK || e.code === CLIENT_ERROR.TIMEOUT);
      setError(connection ? getErrorMessage(e) : '기록을 삭제하지 못했어요. 다시 시도해 주세요.');
      setDeleting(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setError(null);
          setOpen(true);
        }}
        // 누르는 영역 44px 이상 (PRD 5-5 고령 사용자 기준). 음수 여백으로 화면 배치는 그대로
        className="-mx-2 -my-3 flex min-h-11 min-w-11 items-center justify-center px-3 py-3 text-body font-medium text-text-tertiary"
      >
        삭제
      </button>
      <Modal
        open={open}
        tone="danger"
        title="이 기록을 삭제하시겠어요?"
        message={error ?? '삭제한 기록은 복구할 수 없어요.'}
        cancelLabel="취소"
        confirmLabel="삭제하기"
        loading={deleting}
        onConfirm={handleDelete}
        onClose={() => !deleting && setOpen(false)}
      />
    </>
  );
}

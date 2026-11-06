// src/components/diary/ItemDetailDialog.tsx
// 추출 항목의 "자세한 내용" 팝업 (2.2 따옴표 줄, 2.3 수정 버튼에서 열림)
// 팝업 틀(딤·Esc 닫기·스크롤 막기)은 B의 공통 Dialog를 씁니다.
// 처음 열면 AI가 뽑은 일기 원문이 채워져 있고, 사용자가 자유롭게 고쳐 씁니다.
//
// TODO(디자인): "세부 내용 팝업" Figma가 있으면 맞추기

'use client';

import { useId, useState } from 'react';

import Button from '@/components/common/Button';
import Chip from '@/components/common/Chip';
import { Dialog } from '@/components/common/Overlay';
import { getCategory } from '@/components/diary/category';
import { getItemDetail, type ExtractedItem } from '@/lib/api/diary';

const MAX_DETAIL = 300;

type Props = {
  /** 열 항목. null이면 닫힘 */
  item: ExtractedItem | null;
  onClose: () => void;
  /** 저장. 실패하면 throw → 팝업에 오류 문구 표시 */
  onSave: (detail: string) => Promise<void> | void;
};

export default function ItemDetailDialog({ item, onClose, onSave }: Props) {
  const titleId = useId();
  return (
    <Dialog open={item !== null} onClose={onClose} labelledBy={titleId}>
      {/* 항목이 바뀔 때마다 입력 상태를 새로 시작 */}
      {item && <DetailForm key={item.id} titleId={titleId} item={item} onClose={onClose} onSave={onSave} />}
    </Dialog>
  );
}

function DetailForm({
  titleId,
  item,
  onClose,
  onSave,
}: { titleId: string; item: ExtractedItem } & Omit<Props, 'item'>) {
  const category = getCategory(item.category);
  const [draft, setDraft] = useState(getItemDetail(item));
  const [saving, setSaving] = useState(false);
  const [failed, setFailed] = useState(false);

  const save = async () => {
    setSaving(true);
    setFailed(false);
    try {
      await onSave(draft.trim());
      onClose();
    } catch {
      setFailed(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <div>
          <Chip tone={category.tone}>{category.label}</Chip>
        </div>
        <h2 id={titleId} className="text-[18px] leading-[1.35] font-bold text-text-primary">
          {item.summary}
        </h2>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor={`detail-${item.id}`} className="text-caption font-bold text-text-secondary">
          자세한 내용
        </label>
        <div className="flex flex-col gap-1 rounded-input border border-line-strong bg-bg-surface px-3.5 py-3 focus-within:border-primary-base">
          <textarea
            id={`detail-${item.id}`}
            value={draft}
            onChange={(e) => setDraft(e.target.value.slice(0, MAX_DETAIL))}
            rows={5}
            placeholder="언제, 어떤 상황에서, 어떻게 반응했는지 적어 주세요"
            className="w-full resize-none bg-transparent text-body leading-[1.55] text-text-primary placeholder:text-text-tertiary focus:outline-none"
          />
          <p className="text-right text-micro text-text-tertiary">
            {draft.length} / {MAX_DETAIL}
          </p>
        </div>
        {failed && (
          <p className="text-caption text-pink-strong" role="alert">
            저장하지 못했어요. 다시 시도해 주세요.
          </p>
        )}
      </div>

      <div className="flex gap-2">
        <Button variant="outline" fullWidth={false} className="flex-1" onClick={onClose} disabled={saving}>
          취소
        </Button>
        <Button fullWidth={false} className="flex-1" onClick={save} disabled={saving || !draft.trim()}>
          {saving ? '저장 중…' : '저장'}
        </Button>
      </div>
    </div>
  );
}

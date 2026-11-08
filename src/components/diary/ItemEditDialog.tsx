// src/components/diary/ItemEditDialog.tsx
// 2.3 "수정" 팝업: 항목 문장(content)을 고칩니다. 저장하면 반영할 때 "수정 후 승인"으로 보냅니다 (ITEM-01).
// 근거가 된 일기 원문(evidenceQuote)은 참고용으로만 보여주고 고치지 않습니다.
// 팝업 틀(딤·Esc 닫기·스크롤 막기)은 B의 공통 Dialog를 씁니다.
//
// TODO(디자인): "세부 내용 팝업" Figma가 있으면 맞추기

'use client';

import { useId, useState } from 'react';

import Button from '@/components/common/Button';
import Chip from '@/components/common/Chip';
import { Dialog } from '@/components/common/Overlay';
import { getItemChip } from '@/components/diary/category';
import { QuoteIcon } from '@/components/icons/Icons';
import type { DiaryItem } from '@/lib/api/diary';

/** 설명서 항목 1~500자 (GUIDE-03) */
const MAX_CONTENT = 500;

type Props = {
  /** 고칠 항목과 지금 문장. null이면 닫힘 */
  item: DiaryItem | null;
  onClose: () => void;
  onSave: (content: string) => void;
};

export default function ItemEditDialog({ item, onClose, onSave }: Props) {
  const titleId = useId();
  return (
    <Dialog open={item !== null} onClose={onClose} labelledBy={titleId}>
      {/* 항목이 바뀔 때마다 입력 상태를 새로 시작 */}
      {item && <EditForm key={item.itemNo} titleId={titleId} item={item} onClose={onClose} onSave={onSave} />}
    </Dialog>
  );
}

function EditForm({ titleId, item, onClose, onSave }: { titleId: string; item: DiaryItem } & Omit<Props, 'item'>) {
  const chip = getItemChip(item);
  const [draft, setDraft] = useState(item.content);
  const trimmed = draft.trim();

  const save = () => {
    if (!trimmed) return;
    onSave(trimmed);
    onClose();
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <div>
          <Chip tone={chip.tone}>{chip.label}</Chip>
        </div>
        <h2 id={titleId} className="text-[18px] leading-[1.35] font-bold text-text-primary">
          설명서에 들어갈 내용을 고쳐 주세요
        </h2>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor={`item-${item.itemNo}`} className="text-caption font-bold text-text-secondary">
          항목 내용
        </label>
        <div className="flex flex-col gap-1 rounded-input border border-line-strong bg-bg-surface px-3.5 py-3 focus-within:border-primary-base">
          <textarea
            id={`item-${item.itemNo}`}
            value={draft}
            onChange={(e) => setDraft(e.target.value.replace(/\n/g, ' ').slice(0, MAX_CONTENT))}
            rows={3}
            autoFocus
            className="w-full resize-none bg-transparent text-body-lg leading-[1.5] font-bold text-text-primary focus:outline-none"
          />
          <p className="text-right text-micro text-text-tertiary">
            {draft.length} / {MAX_CONTENT}
          </p>
        </div>
      </div>

      {item.evidenceQuote && (
        <div className="flex flex-col gap-1 rounded-input bg-bg-subtle px-3.5 py-3">
          <span className="flex items-center gap-1 text-micro font-bold text-text-tertiary">
            <QuoteIcon size={12} /> 일기 원문
          </span>
          <p className="text-caption leading-[1.5] text-text-secondary">{item.evidenceQuote}</p>
          <p className="text-micro text-text-tertiary">일기 원문은 설명서와 공유 문서에 들어가지 않아요</p>
        </div>
      )}

      <div className="flex gap-2">
        <Button variant="outline" fullWidth={false} className="flex-1" onClick={onClose}>
          취소
        </Button>
        <Button fullWidth={false} className="flex-1" onClick={save} disabled={!trimmed}>
          저장
        </Button>
      </div>
    </div>
  );
}

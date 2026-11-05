// src/components/diary/ReviewItemCard.tsx
// 2.3 검토 화면의 항목 카드 한 개
//   - 검토 대기: 흰 카드, [제외] [승인]             (Figma 35:2729)
//   - 승인:      주황 테두리, [제외] [✓ 승인됨]       (Figma 35:2720)
//   - 제외:      베이지 카드, 취소선, [제외 취소]      (Figma 35:2799)
//   - 수정:      자세한 내용 팝업(ItemDetailDialog)을 엶 → 2.2 따옴표 줄과 같은 내용

'use client';

import Button from '@/components/common/Button';
import Chip from '@/components/common/Chip';
import { getCategory } from '@/components/diary/category';
import { CheckIcon } from '@/components/icons/Icons';
import type { ExtractedItem } from '@/lib/api/diary';

export type ReviewStatus = 'PENDING' | 'APPROVED' | 'EXCLUDED';

type Props = {
  item: ExtractedItem;
  status: ReviewStatus;
  disabled?: boolean;
  onStatusChange: (status: ReviewStatus) => void;
  /** "수정" — 자세한 내용 팝업 열기 */
  onEdit: () => void;
};

// 카드 안 버튼은 높이 46 (B의 Button 기본 56을 덮어씀)
const CARD_BUTTON = 'h-[46px]! flex-1';

export default function ReviewItemCard({ item, status, disabled = false, onStatusChange, onEdit }: Props) {
  const category = getCategory(item.category);
  const isApproved = status === 'APPROVED';
  const isExcluded = status === 'EXCLUDED';

  const cardStyle = isExcluded
    ? 'bg-bg-subtle border-transparent'
    : isApproved
      ? 'bg-bg-surface border-primary-base'
      : 'bg-bg-surface border-transparent';

  return (
    <li className={`flex flex-col gap-3 rounded-card border-[1.5px] px-4 py-[14px] ${cardStyle}`}>
      {/* 분류 칩 + 제외됨 표시 + 수정 */}
      <div className="flex items-center gap-2">
        <Chip tone={category.tone} className={isExcluded ? 'opacity-50' : ''}>
          {category.label}
        </Chip>
        {isExcluded && <Chip tone="pink">제외됨</Chip>}
        <span className="flex-1" />
        {!isExcluded && (
          <button
            type="button"
            onClick={onEdit}
            disabled={disabled}
            aria-label={`${item.summary} 자세한 내용 수정`}
            className="text-[14px] leading-[1.45] font-medium text-text-secondary underline disabled:opacity-50"
          >
            수정
          </button>
        )}
      </div>

      <p
        className={`text-body-lg leading-[1.45] font-bold ${
          isExcluded ? 'text-text-tertiary line-through' : 'text-text-primary'
        }`}
      >
        {item.summary}
      </p>

      {/* 버튼 */}
      <div className="flex gap-2">
        {isExcluded ? (
          <Button
            variant="outline"
            fullWidth={false}
            className={CARD_BUTTON}
            onClick={() => onStatusChange('PENDING')}
            disabled={disabled}
          >
            제외 취소
          </Button>
        ) : (
          <>
            <Button
              variant="outline"
              fullWidth={false}
              className={CARD_BUTTON}
              onClick={() => onStatusChange('EXCLUDED')}
              disabled={disabled}
            >
              제외
            </Button>
            <Button
              variant={isApproved ? 'primary' : 'soft'}
              fullWidth={false}
              className={`${CARD_BUTTON} gap-1`}
              aria-pressed={isApproved}
              // 승인됨을 다시 누르면 검토 대기로 되돌림
              onClick={() => onStatusChange(isApproved ? 'PENDING' : 'APPROVED')}
              disabled={disabled}
            >
              {isApproved ? (
                <>
                  <CheckIcon size={16} /> 승인됨
                </>
              ) : (
                '승인'
              )}
            </Button>
          </>
        )}
      </div>
    </li>
  );
}

// src/components/onboarding/SelectField.tsx
// 0.2 드롭다운 (Figma Select + [상태] 펼침 59:2429 · 59:2472 · 59:2552 · 59:2602)
//   - 닫힘: 흰 칸 + 아래 화살표 / 펼침: 진한 주황 테두리 + 아래로 목록, 고른 값은 연한 주황 + 체크
//   - 목록 바깥을 누르거나 Esc → 닫힘, ↑↓ Enter로도 고를 수 있음
// TODO(B): 공통 Select가 이 모양(목록 펼침)을 지원하면 그걸로 교체

'use client';

import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';

import { CheckIcon, ChevronDownIcon } from '@/components/icons/Icons';

export type SelectOption<T extends string | number> = { value: T; label: string };

type Props<T extends string | number> = {
  label?: string;
  /** 라벨을 화면에 안 보일 때 (지역 2칸 중 오른쪽 등) 읽어줄 이름 */
  ariaLabel?: string;
  value: T | null;
  options: SelectOption<T>[];
  placeholder: string;
  onChange: (value: T) => void;
  /** 아무것도 안 골랐을 때 목록을 처음 열면 이 값 근처를 보여줌 (예: 연도 1970) */
  scrollHint?: T;
  disabled?: boolean;
};

export default function SelectField<T extends string | number>({
  label,
  ariaLabel,
  value,
  options,
  placeholder,
  onChange,
  scrollHint,
  disabled,
}: Props<T>) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const selected = options.find((o) => o.value === value) ?? null;

  // 바깥을 누르면 닫기
  useEffect(() => {
    if (!open) return;
    const handle = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', handle);
    return () => document.removeEventListener('pointerdown', handle);
  }, [open]);

  // ↑↓로 움직일 때 목록 안에서만 스크롤 (화면 전체는 안 움직이게)
  useEffect(() => {
    if (!open || activeIndex < 0) return;
    const list = listRef.current;
    const item = list?.children[activeIndex] as HTMLElement | undefined;
    if (!list || !item) return;
    if (item.offsetTop < list.scrollTop) list.scrollTop = item.offsetTop;
    else if (item.offsetTop + item.offsetHeight > list.scrollTop + list.clientHeight) {
      list.scrollTop = item.offsetTop + item.offsetHeight - list.clientHeight;
    }
  }, [open, activeIndex]);

  const openList = () => {
    if (disabled) return;
    const target = value ?? scrollHint ?? null;
    const index = target === null ? 0 : options.findIndex((o) => o.value === target);
    setActiveIndex(Math.max(0, index));
    setOpen(true);
    // 고른 값을 목록 가운데로 (목록 안에서만 스크롤)
    requestAnimationFrame(() => {
      const list = listRef.current;
      const item = list?.children[Math.max(0, index)] as HTMLElement | undefined;
      if (list && item) list.scrollTop = item.offsetTop - list.clientHeight / 2 + item.clientHeight / 2;
    });
  };

  const choose = (option: SelectOption<T>) => {
    onChange(option.value);
    setOpen(false);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (!open) {
      if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openList();
      }
      return;
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      setOpen(false);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(options.length - 1, i + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(0, i - 1));
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      const option = options[activeIndex];
      if (option) choose(option);
    } else if (e.key === 'Tab') {
      setOpen(false);
    }
  };

  const listId = `${id}-list`;

  return (
    <div className="flex min-w-0 flex-col gap-2">
      {label && (
        <span id={`${id}-label`} className="text-body leading-[1.45] font-bold text-text-primary">
          {label}
        </span>
      )}
      <div ref={rootRef} className="relative">
        <button
          type="button"
          role="combobox"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={listId}
          aria-labelledby={label ? `${id}-label ${id}-value` : undefined}
          aria-label={label ? undefined : ariaLabel}
          aria-activedescendant={open && activeIndex >= 0 ? `${id}-opt-${activeIndex}` : undefined}
          disabled={disabled}
          onClick={() => (open ? setOpen(false) : openList())}
          onKeyDown={handleKeyDown}
          className={`flex h-14 w-full items-center gap-2 rounded-input border bg-bg-surface pr-3.5 pl-[18px] text-left transition-colors disabled:opacity-50 ${
            open ? 'border-primary-strong ring-[0.5px] ring-primary-strong' : 'border-line-strong'
          }`}
        >
          <span id={`${id}-value`} className={`min-w-0 flex-1 truncate text-body-lg ${selected ? 'text-text-primary' : 'text-text-tertiary'}`}>
            {selected ? selected.label : placeholder}
          </span>
          <ChevronDownIcon size={20} className={`shrink-0 text-text-secondary transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>

        {open && (
          <ul
            ref={listRef}
            id={listId}
            role="listbox"
            className={`absolute right-0 left-0 z-30 max-h-[244px] overflow-y-auto top-full mt-1.5 rounded-input border border-line-base bg-bg-surface p-1.5 shadow-[0_8px_24px_rgba(59,47,42,0.12)]`}
          >
            {options.map((option, index) => {
              const isSelected = option.value === value;
              const isActive = index === activeIndex;
              return (
                <li
                  key={String(option.value)}
                  id={`${id}-opt-${index}`}
                  role="option"
                  aria-selected={isSelected}
                  onPointerEnter={() => setActiveIndex(index)}
                  onClick={() => choose(option)}
                  className={`flex h-[46px] cursor-pointer items-center justify-between rounded-[10px] px-3 text-body-lg ${
                    isSelected ? 'bg-primary-soft font-bold text-primary-strong' : isActive ? 'bg-bg-subtle text-text-primary' : 'text-text-primary'
                  }`}
                >
                  <span className="truncate">{option.label}</span>
                  {isSelected && <CheckIcon size={16} className="shrink-0" />}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}


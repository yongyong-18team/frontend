"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { CheckIcon, ChevronDownIcon } from "@/components/icons/Icons";

export type SelectOption = { value: string; label: string };

type SelectProps = {
  label?: string;
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  helper?: string;
  required?: boolean;
  disabled?: boolean;
  /** 입력칸에 보여줄 글자를 바꾸고 싶을 때 (예: "기흥구" → "용인시 기흥구") */
  formatSelected?: (option: SelectOption) => string;
  "aria-label"?: string;
  className?: string;
};

/** Figma Select + [상태] 펼침: 칸 56·모서리 14·좌18/우14, 목록 상자 p6·간격2, 옵션 p12·모서리 10 */
export default function Select({
  label,
  options,
  value,
  onChange,
  placeholder = "선택해 주세요",
  error,
  helper,
  required,
  disabled,
  formatSelected,
  "aria-label": ariaLabel,
  className = "",
}: SelectProps) {
  const id = useId();
  const labelId = `${id}-label`;
  const listId = `${id}-list`;
  const msgId = `${id}-msg`;

  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const selectedIndex = options.findIndex((o) => o.value === value);
  const selected = selectedIndex >= 0 ? options[selectedIndex] : null;
  const message = error ?? helper;

  // 바깥을 누르면 닫기
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent | TouchEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("touchstart", onDown);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("touchstart", onDown);
    };
  }, [open]);

  // 열렸을 때 현재 항목이 보이도록 스크롤
  useEffect(() => {
    if (!open || active < 0) return;
    const el = listRef.current?.children[active] as HTMLElement | undefined;
    el?.scrollIntoView({ block: "nearest" });
  }, [open, active]);

  const openList = () => {
    if (disabled) return;
    setActive(selectedIndex >= 0 ? selectedIndex : 0);
    setOpen(true);
  };

  const choose = (i: number) => {
    onChange(options[i].value);
    setOpen(false);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (!open) {
      if (["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) {
        e.preventDefault();
        openList();
      }
      return;
    }
    if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, options.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (active >= 0) choose(active);
    } else if (e.key === "Tab") {
      setOpen(false);
    }
  };

  const borderClass = open
    ? "border-2 border-primary-strong"
    : error
      ? "border-[1.5px] border-pink-strong"
      : "border border-line-strong";

  return (
    <div ref={rootRef} className={`relative flex w-full flex-col gap-2 ${className}`}>
      {label && (
        <span id={labelId} className="text-body font-bold text-text-primary">
          {label}
          {required && " *"}
        </span>
      )}

      <button
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-labelledby={label ? labelId : undefined}
        aria-label={label ? undefined : ariaLabel}
        aria-activedescendant={open && active >= 0 ? `${id}-opt-${active}` : undefined}
        aria-invalid={!!error}
        aria-describedby={message ? msgId : undefined}
        disabled={disabled}
        onClick={() => (open ? setOpen(false) : openList())}
        onKeyDown={onKeyDown}
        className={`flex h-14 w-full items-center gap-2 rounded-input bg-bg-surface pl-[18px] pr-3.5 text-left text-body-lg outline-none disabled:opacity-50 ${borderClass}`}
      >
        <span className={`min-w-0 flex-1 truncate ${selected ? "text-text-primary" : "text-text-tertiary"}`}>
          {selected ? (formatSelected ? formatSelected(selected) : selected.label) : placeholder}
        </span>
        <ChevronDownIcon size={20} className="shrink-0 text-text-secondary" />
      </button>

      {open && (
        <ul
          ref={listRef}
          id={listId}
          role="listbox"
          aria-labelledby={label ? labelId : undefined}
          className="absolute left-0 right-0 top-full z-40 mt-1.5 flex max-h-72 flex-col gap-0.5 overflow-y-auto rounded-input border border-line-strong bg-bg-surface p-1.5 shadow-pop"
        >
          {options.map((o, i) => {
            const isSelected = i === selectedIndex;
            return (
              <li
                key={o.value}
                id={`${id}-opt-${i}`}
                role="option"
                aria-selected={isSelected}
                onMouseEnter={() => setActive(i)}
                onClick={() => choose(i)}
                className={`flex shrink-0 cursor-pointer items-center gap-2 rounded-[10px] p-3 text-body-lg leading-[1.3] ${
                  isSelected
                    ? "bg-primary-soft font-bold text-primary-strong"
                    : i === active
                      ? "bg-bg-subtle text-text-primary"
                      : "text-text-primary"
                }`}
              >
                <span className="min-w-0 flex-1">{o.label}</span>
                {isSelected && <CheckIcon size={18} className="shrink-0" />}
              </li>
            );
          })}
        </ul>
      )}

      {message && (
        <p id={msgId} className={`text-caption ${error ? "text-pink-strong" : "text-text-secondary"}`}>
          {message}
        </p>
      )}
    </div>
  );
}
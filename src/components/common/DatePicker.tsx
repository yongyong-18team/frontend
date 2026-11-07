"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon } from "@/components/icons/Icons";

type DatePickerProps = {
  label?: string;
  required?: boolean;
  /** "yyyy-MM-dd" 또는 "" */
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  /** true면 오늘 이전 날짜는 고를 수 없음 */
  disablePast?: boolean;
};

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];
const pad = (n: number) => String(n).padStart(2, "0");
const toYmd = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`;

/** "2026-11-05" → "2026.11.05 (목)" */
export function formatYmd(ymd: string) {
  const [y, m, d] = ymd.split("-").map(Number);
  return `${y}.${pad(m)}.${pad(d)} (${WEEKDAYS[new Date(y, m - 1, d).getDay()]})`;
}

/** 오늘 (한국 시간) — 그리는 중이 아니라 누를 때만 부름 (Cache Components 규칙) */
function todayYmd() {
  return new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

/**
 * 날짜 선택 — 칸 모양은 Figma Select, 펼치면 웜 파스텔 달력
 * (Figma에 달력 디자인이 없어 Select 펼침 상자와 같은 규칙으로 만듦)
 */
export default function DatePicker({
  label,
  required,
  value,
  onChange,
  placeholder = "날짜를 선택해 주세요",
  error,
  disablePast = false,
}: DatePickerProps) {
  const id = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [today, setToday] = useState<string | null>(null);
  const [view, setView] = useState<{ y: number; m: number } | null>(null);

  // 바깥을 누르거나 Esc면 닫기
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent | TouchEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("touchstart", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("touchstart", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const toggle = () => {
    if (open) return setOpen(false);
    const t = todayYmd();
    const base = value || t;
    setToday(t);
    setView({ y: Number(base.slice(0, 4)), m: Number(base.slice(5, 7)) - 1 });
    setOpen(true);
  };

  const move = (diff: number) =>
    setView((v) => {
      if (!v) return v;
      const d = new Date(v.y, v.m + diff, 1);
      return { y: d.getFullYear(), m: d.getMonth() };
    });

  const borderClass = open
    ? "border-2 border-primary-strong"
    : error
      ? "border-[1.5px] border-pink-strong"
      : "border border-line-strong";

  // 달력 칸 (앞쪽 빈칸 + 날짜)
  const cells: (number | null)[] = [];
  if (view) {
    const first = new Date(view.y, view.m, 1).getDay();
    const days = new Date(view.y, view.m + 1, 0).getDate();
    for (let i = 0; i < first; i++) cells.push(null);
    for (let d = 1; d <= days; d++) cells.push(d);
  }
  const canPrev =
    !disablePast || !view || !today || toYmd(view.y, view.m, 1) > today.slice(0, 8) + "01";

  return (
    <div ref={rootRef} className="relative flex w-full flex-col gap-2">
      {label && (
        <span id={`${id}-label`} className="text-body font-bold text-text-primary">
          {label}
          {required && " *"}
        </span>
      )}

      <button
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-labelledby={label ? `${id}-label` : undefined}
        aria-invalid={!!error}
        onClick={toggle}
        className={`flex h-14 w-full items-center gap-2 rounded-input bg-bg-surface pl-[18px] pr-3.5 text-left text-body-lg outline-none ${borderClass}`}
      >
        <span className={`min-w-0 flex-1 truncate ${value ? "text-text-primary" : "text-text-tertiary"}`}>
          {value ? formatYmd(value) : placeholder}
        </span>
        <ChevronDownIcon size={20} className="shrink-0 text-text-secondary" />
      </button>

      {open && view && (
        <div
          role="dialog"
          aria-label="날짜 선택"
          className="absolute left-0 right-0 top-full z-40 mt-1.5 rounded-input border border-line-strong bg-bg-surface p-3 shadow-pop"
        >
          {/* 월 이동 */}
          <div className="flex items-center justify-between pb-2">
            <button
              type="button"
              aria-label="이전 달"
              disabled={!canPrev}
              onClick={() => move(-1)}
              className="flex h-10 w-10 items-center justify-center rounded-full text-text-secondary active:bg-bg-subtle disabled:opacity-30"
            >
              <ChevronLeftIcon size={22} />
            </button>
            <span className="text-subhead font-bold text-text-primary">
              {view.y}년 {view.m + 1}월
            </span>
            <button
              type="button"
              aria-label="다음 달"
              onClick={() => move(1)}
              className="flex h-10 w-10 items-center justify-center rounded-full text-text-secondary active:bg-bg-subtle"
            >
              <ChevronRightIcon size={20} />
            </button>
          </div>

          {/* 요일 */}
          <div className="grid grid-cols-7 pb-1">
            {WEEKDAYS.map((w, i) => (
              <span
                key={w}
                className={`flex h-8 items-center justify-center text-caption font-bold ${
                  i === 0 ? "text-pink-strong" : i === 6 ? "text-sky-strong" : "text-text-tertiary"
                }`}
              >
                {w}
              </span>
            ))}
          </div>

          {/* 날짜 */}
          <div className="grid grid-cols-7 gap-y-1">
            {cells.map((d, i) => {
              if (d === null) return <span key={`e${i}`} />;
              const ymd = toYmd(view.y, view.m, d);
              const isSelected = ymd === value;
              const isToday = ymd === today;
              const disabled = disablePast && !!today && ymd < today;
              const weekday = i % 7;
              const color = isSelected
                ? "bg-primary-strong font-bold text-text-on-primary"
                : disabled
                  ? "text-text-tertiary opacity-40"
                  : isToday
                    ? "bg-primary-soft font-bold text-primary-strong"
                    : weekday === 0
                      ? "text-pink-strong active:bg-bg-subtle"
                      : weekday === 6
                        ? "text-sky-strong active:bg-bg-subtle"
                        : "text-text-primary active:bg-bg-subtle";
              return (
                <span key={ymd} className="flex items-center justify-center">
                  <button
                    type="button"
                    disabled={disabled}
                    aria-pressed={isSelected}
                    aria-label={`${view.y}년 ${view.m + 1}월 ${d}일 ${WEEKDAYS[weekday]}요일${isToday ? ", 오늘" : ""}`}
                    onClick={() => {
                      onChange(ymd);
                      setOpen(false);
                    }}
                    className={`flex h-11 w-11 items-center justify-center rounded-full text-body ${color}`}
                  >
                    {d}
                  </button>
                </span>
              );
            })}
          </div>
        </div>
      )}

      {error && <p className="text-caption text-pink-strong">{error}</p>}
    </div>
  );
}
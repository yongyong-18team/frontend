"use client";

import { useEffect, useId, type ReactNode } from "react";

/** 열려 있는 동안 Esc로 닫기 + 뒤 화면 스크롤 막기 */
function useOverlay(open: boolean, onClose: () => void) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);
}

/** Figma 딤: text/primary 45% */
const DIM = "absolute inset-0 bg-text-primary/45";
const btn = "h-14 flex-1 rounded-button text-subhead font-bold transition-opacity active:opacity-80 disabled:opacity-50";

/* ---------- Modal: 확인 팝업 (취소 / 확인) ---------- */
type ModalProps = {
  open: boolean;
  title: ReactNode;
  message?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "default" | "danger";
  loading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
};

export function Modal({
  open,
  title,
  message,
  confirmLabel = "확인",
  cancelLabel = "취소",
  tone = "default",
  loading = false,
  onConfirm,
  onClose,
}: ModalProps) {
  const titleId = useId();
  useOverlay(open, onClose);
  if (!open) return null;

  const confirmColor = tone === "danger" ? "bg-pink-strong text-text-on-primary" : "bg-primary-strong text-text-on-primary";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
      <div className={DIM} onClick={onClose} aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative w-full max-w-[382px] rounded-[24px] bg-bg-surface px-[22px] pb-[22px] pt-5 shadow-pop"
      >
        <h2 id={titleId} className="text-[18px] font-bold leading-[1.35] text-text-primary">
          {title}
        </h2>
        {message && <div className="mt-2 text-body text-text-secondary">{message}</div>}

        <div className="mt-6 flex gap-2">
          {cancelLabel && (
            <button type="button" onClick={onClose} className={`${btn} border-[1.5px] border-line-strong bg-bg-surface text-text-primary`}>
              {cancelLabel}
            </button>
          )}
          <button type="button" onClick={onConfirm} disabled={loading} className={`${btn} ${confirmColor}`}>
            {loading ? "처리 중..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------- BottomSheet: 아래에서 올라오는 시트 ---------- */
type BottomSheetProps = {
  open: boolean;
  title?: ReactNode;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
};

export function BottomSheet({ open, title, onClose, children, footer }: BottomSheetProps) {
  const titleId = useId();
  useOverlay(open, onClose);
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className={DIM} onClick={onClose} aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        className="relative flex max-h-[85vh] w-full max-w-[430px] flex-col rounded-t-sheet bg-bg-surface shadow-sheet"
      >
        <div className="flex justify-center pt-3">
          <span className="h-1.5 w-10 rounded-chip bg-line-strong" aria-hidden />
        </div>
        {title && (
          <h2 id={titleId} className="px-6 pt-4 text-[18px] font-bold leading-[1.35] text-text-primary">
            {title}
          </h2>
        )}
        <div className="flex-1 overflow-y-auto px-6 py-4">{children}</div>
        {footer && <div className="px-6 pb-8 pt-2">{footer}</div>}
      </div>
    </div>
  );
}

/* ---------- Dialog: 가운데 팝업 (내용 자유) — Figma 세부 내용 팝업 ---------- */
type DialogProps = {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  labelledBy?: string;
};

export function Dialog({ open, onClose, children, labelledBy }: DialogProps) {
  useOverlay(open, onClose);
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
      <div className={DIM} onClick={onClose} aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        className="relative max-h-[85vh] w-full max-w-[382px] overflow-y-auto rounded-[24px] bg-bg-surface px-[22px] pb-[22px] pt-5 shadow-pop"
      >
        {children}
      </div>
    </div>
  );
}
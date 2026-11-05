"use client";

import { useId, type InputHTMLAttributes, type ReactNode } from "react";
import { CheckIcon } from "@/components/icons/Icons";

type ChoiceProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "size"> & {
  label: ReactNode;
  description?: ReactNode;
};

/**
 * Figma 4.1 선택 줄: 상하 14·간격 12
 * - 선택됨: 제목 15 Bold text-primary / 선택 안 됨: 15 Medium text-secondary
 * - 비활성: 글자만 50% 투명
 */
function ChoiceText({ label, description, disabled }: { label: ReactNode; description?: ReactNode; disabled?: boolean }) {
  return (
    <span
      className={`flex min-w-0 flex-1 flex-col gap-0.5 text-body font-medium leading-[1.45] text-text-secondary peer-checked:font-bold peer-checked:text-text-primary ${
        disabled ? "opacity-50" : ""
      }`}
    >
      <span>{label}</span>
      {description && <span className="text-caption font-normal text-text-tertiary">{description}</span>}
    </span>
  );
}

const row = "flex w-full items-center gap-3 py-3.5";

/** 체크박스: 24·모서리 7, 선택 시 코랄 배경 + 흰 ✓ */
export function Checkbox({ label, description, id, disabled, className = "", ...rest }: ChoiceProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  return (
    <label htmlFor={inputId} className={`${row} ${disabled ? "cursor-not-allowed" : "cursor-pointer"} ${className}`}>
      <input id={inputId} type="checkbox" disabled={disabled} className="peer sr-only" {...rest} />
      <span
        aria-hidden
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-[7px] border-[1.5px] border-line-strong bg-bg-surface text-transparent peer-checked:border-primary-strong peer-checked:bg-primary-strong peer-checked:text-text-on-primary peer-focus-visible:ring-2 peer-focus-visible:ring-primary-base"
      >
        <CheckIcon size={14} />
      </span>
      <ChoiceText label={label} description={description} disabled={disabled} />
    </label>
  );
}

/** 라디오: 22, 선택 시 코랄 테두리 2 + 가운데 점 10 */
export function Radio({ label, description, id, disabled, className = "", ...rest }: ChoiceProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  return (
    <label htmlFor={inputId} className={`${row} ${disabled ? "cursor-not-allowed" : "cursor-pointer"} ${className}`}>
      <input id={inputId} type="radio" disabled={disabled} className="peer sr-only" {...rest} />
      <span
        aria-hidden
        className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full border-[1.5px] border-line-strong bg-bg-surface text-transparent peer-checked:border-2 peer-checked:border-primary-strong peer-checked:text-primary-strong peer-focus-visible:ring-2 peer-focus-visible:ring-primary-base"
      >
        <span className="h-2.5 w-2.5 rounded-full bg-current" />
      </span>
      <ChoiceText label={label} description={description} disabled={disabled} />
    </label>
  );
}

/** 토글: 48×28, 손잡이 22, 켜짐 코랄 (Figma 4.1 비상 연락처 표시) */
export function Toggle({ label, description, id, disabled, className = "", ...rest }: ChoiceProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  return (
    <label htmlFor={inputId} className={`flex w-full items-center gap-3 ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"} ${className}`}>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5 leading-[1.45]">
        <span className="text-body font-bold text-text-primary">{label}</span>
        {description && <span className="text-caption text-text-secondary">{description}</span>}
      </span>
      <input id={inputId} type="checkbox" role="switch" disabled={disabled} className="peer sr-only" {...rest} />
      <span
        aria-hidden
        className="relative h-7 w-12 shrink-0 rounded-full bg-line-strong transition-colors after:absolute after:left-[3px] after:top-[3px] after:h-[22px] after:w-[22px] after:rounded-full after:bg-bg-surface after:transition-transform peer-checked:bg-primary-strong peer-checked:after:translate-x-5 peer-focus-visible:ring-2 peer-focus-visible:ring-primary-base"
      />
    </label>
  );
}
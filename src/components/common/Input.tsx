"use client";

import { useId, type InputHTMLAttributes } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  /** 오류 문구 (API error.message를 그대로 넣어도 됨). 있으면 빨간 테두리 */
  error?: string;
  /** 오류가 없을 때 보여줄 안내 문구 */
  helper?: string;
};

/** 라벨 + 입력창(높이 56) + 안내/오류 문구 */
export default function Input({ label, error, helper, required, id, className = "", ...rest }: InputProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const messageId = `${inputId}-message`;
  const message = error ?? helper;

  return (
    <div className={`flex w-full flex-col gap-2 ${className}`}>
      {label && (
        <label htmlFor={inputId} className="text-body font-bold text-text-primary">
          {label}
          {required && <span className="text-primary-strong"> *</span>}
        </label>
      )}
      <input
        id={inputId}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={message ? messageId : undefined}
        className={`h-14 w-full rounded-input bg-bg-surface px-[18px] text-body-lg text-text-primary outline-none placeholder:text-text-tertiary disabled:bg-bg-subtle disabled:text-text-tertiary ${
          error
            ? "border-[1.5px] border-pink-strong"
            : "border border-line-strong focus:border-2 focus:border-primary-strong"
        }`}
        {...rest}
      />
      {message && (
        <p id={messageId} className={`text-caption font-medium ${error ? "text-pink-strong" : "text-text-tertiary"}`}>
          {message}
        </p>
      )}
    </div>
  );
}
"use client";

import { useId, type InputHTMLAttributes } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
  helper?: string;
};

/** Figma Input: 라벨 15 Bold, 칸 높이 56·모서리 14·좌우 18, 글자 16 */
export default function Input({ label, error, helper, required, id, className = "", ...rest }: InputProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const msgId = `${inputId}-msg`;
  const message = error ?? helper;

  return (
    <div className="flex w-full flex-col gap-2">
      {label && (
        <label htmlFor={inputId} className="text-body font-bold text-text-primary">
          {label}
          {required && " *"}
        </label>
      )}
      <input
        id={inputId}
        required={required}
        aria-invalid={!!error}
        aria-describedby={message ? msgId : undefined}
        className={`h-14 w-full rounded-input bg-bg-surface px-[18px] text-body-lg text-text-primary outline-none placeholder:text-text-tertiary focus:border-2 focus:border-primary-strong ${
          error ? "border-[1.5px] border-pink-strong" : "border border-line-strong"
        } ${className}`}
        {...rest}
      />
      {message && (
        <p id={msgId} className={`text-caption ${error ? "text-pink-strong" : "text-text-secondary"}`}>
          {message}
        </p>
      )}
    </div>
  );
}
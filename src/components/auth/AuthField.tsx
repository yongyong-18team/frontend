// src/components/auth/AuthField.tsx
// 0.1 로그인·가입 입력칸 (Figma Input: Default·Filled·Focused·Error + 가입의 "사용 가능" 상태)
//   - 기본: 1px line-strong / 입력 중: primary-strong 2px / 오류: pink 1.5px + 문구 / 사용 가능: mint 1.5px + 문구
// TODO(B): 공통 Input.tsx가 같은 상태를 지원하면 그걸로 교체

'use client';

import type { InputHTMLAttributes } from 'react';

type Status = 'default' | 'error' | 'success';

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, 'className'> & {
  id: string;
  label: string;
  status?: Status;
  /** 칸 아래 문구 (오류·사용 가능 안내) */
  helper?: string | null;
};

const FIELD_STYLE: Record<Status, string> = {
  // 2px 테두리로 바뀔 때 칸이 밀리지 않도록 1px 테두리 + 1px 링으로 표현
  default: 'border-line-strong focus-within:border-primary-strong focus-within:ring-1 focus-within:ring-primary-strong',
  error: 'border-pink-strong ring-[0.5px] ring-pink-strong',
  success: 'border-mint-strong ring-[0.5px] ring-mint-strong',
};

const HELPER_STYLE: Record<Status, string> = {
  default: 'text-text-tertiary',
  error: 'text-pink-strong',
  success: 'text-mint-strong',
};

export default function AuthField({ id, label, status = 'default', helper, ...input }: Props) {
  const helperId = helper ? `${id}-helper` : undefined;
  return (
    <div className="flex min-w-0 flex-col gap-2">
      <label htmlFor={id} className="text-body leading-[1.45] font-bold text-text-primary">
        {label}
      </label>
      <div className={`flex h-14 items-center rounded-input border bg-bg-surface px-[18px] ${FIELD_STYLE[status]}`}>
        <input
          id={id}
          aria-invalid={status === 'error'}
          aria-describedby={helperId}
          className="min-w-0 flex-1 bg-transparent text-body-lg text-text-primary placeholder:text-text-tertiary focus:outline-none"
          {...input}
        />
      </div>
      {helper && (
        <p
          id={helperId}
          role={status === 'error' ? 'alert' : undefined}
          className={`text-caption leading-[1.45] font-medium ${HELPER_STYLE[status]}`}
        >
          {helper}
        </p>
      )}
    </div>
  );
}

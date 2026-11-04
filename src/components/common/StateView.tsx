import type { ReactNode } from "react";
import { AlertIcon, RecordIcon } from "../icons/Icons";
import Button from "./Button";

/** 로딩: 회색 블록(스켈레톤) 카드 */
export function LoadingState({ count = 2, label = "불러오는 중이에요" }: { count?: number; label?: string }) {
  return (
    <div role="status" aria-live="polite" className="flex flex-col gap-3">
      <span className="sr-only">{label}</span>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="animate-pulse rounded-card bg-bg-surface p-4">
          <div className="mb-3 h-5 w-20 rounded-lg bg-bg-subtle" />
          <div className="mb-2 h-4 w-4/5 rounded-lg bg-bg-subtle" />
          <div className="h-3.5 w-1/2 rounded-lg bg-bg-subtle" />
        </div>
      ))}
    </div>
  );
}

function Halo({ tone, children }: { tone: "primary" | "peach"; children: ReactNode }) {
  const ring = tone === "primary" ? "bg-primary-soft text-primary-strong" : "bg-peach-soft text-peach-strong";
  return (
    <div className={`flex h-28 w-28 items-center justify-center rounded-full ${ring}`}>
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-bg-surface">{children}</div>
    </div>
  );
}

type EmptyProps = {
  title: string;
  description?: string;
  icon?: ReactNode;
  actionLabel?: string;
  onAction?: () => void;
};

/** 빈 상태: 아이콘 + 제목 + 설명 + (선택) 버튼 */
export function EmptyState({ title, description, icon, actionLabel, onAction }: EmptyProps) {
  return (
    <div className="flex flex-col items-center gap-3.5 py-6 text-center">
      <Halo tone="primary">{icon ?? <RecordIcon size={38} />}</Halo>
      <p className="text-heading font-bold text-text-primary">{title}</p>
      {description && <p className="whitespace-pre-line text-body text-text-secondary">{description}</p>}
      {actionLabel && onAction && (
        <Button variant="outline" onClick={onAction} className="mt-2">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

type ErrorProps = {
  /** API error.message를 그대로 넣어도 된다 */
  message?: string;
  onRetry?: () => void;
};

/** 오류: 경고 아이콘 + 문구 + 다시 시도 */
export function ErrorState({ message = "정보를 불러오지 못했어요.", onRetry }: ErrorProps) {
  return (
    <div role="alert" className="flex flex-col items-center gap-3.5 py-6 text-center">
      <Halo tone="peach">
        <AlertIcon size={38} />
      </Halo>
      <p className="text-heading font-bold text-text-primary">{message}</p>
      {onRetry && (
        <Button onClick={onRetry} className="mt-2">
          다시 시도
        </Button>
      )}
    </div>
  );
}
import type { ReactNode } from "react";
import Button from "./Button";
import { AlertIcon, InfoIcon } from "@/components/icons/Icons";

/** Figma 2.2 [예외] 일러스트: 바깥 132 살구 원 + 안쪽 96 흰 원 + 아이콘 44 */
function Halo({ children }: { children: ReactNode }) {
  return (
    <span className="flex h-[132px] w-[132px] shrink-0 items-center justify-center rounded-full bg-peach-soft" aria-hidden>
      <span className="flex h-24 w-24 items-center justify-center rounded-full bg-bg-surface text-peach-strong">{children}</span>
    </span>
  );
}

/** 제목 21 Bold + 설명 15 secondary (여러 줄은 \n 으로) */
function StateText({ title, description }: { title: ReactNode; description?: ReactNode }) {
  return (
    <div className="flex flex-col gap-3.5">
      <h2 className="text-[21px] font-bold leading-[1.35] text-text-primary">{title}</h2>
      {description && <p className="whitespace-pre-line text-body leading-[1.55] text-text-secondary">{description}</p>}
    </div>
  );
}

/* ---------- 로딩 ---------- */
type LoadingStateProps = { message?: string };

export function LoadingState({ message }: LoadingStateProps) {
  return (
    <div role="status" aria-live="polite" className="flex flex-col gap-3 px-6 py-6">
      <div className="h-7 w-2/3 animate-pulse rounded-input bg-bg-subtle" />
      <div className="h-24 w-full animate-pulse rounded-card bg-bg-subtle" />
      <div className="h-24 w-full animate-pulse rounded-card bg-bg-subtle" />
      <span className={message ? "pt-2 text-center text-body text-text-secondary" : "sr-only"}>
        {message ?? "불러오는 중이에요"}
      </span>
    </div>
  );
}

/* ---------- 빈 상태 ---------- */
type EmptyStateProps = {
  title: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  actionLabel?: string;
  onAction?: () => void;
};

export function EmptyState({ title, description, icon, actionLabel, onAction }: EmptyStateProps) {
  return (
    <section className="flex flex-col items-center gap-3.5 px-6 py-10 text-center">
      <Halo>{icon ?? <InfoIcon size={44} />}</Halo>
      <StateText title={title} description={description} />
      {actionLabel && onAction && (
        <div className="mt-4 w-full">
          <Button onClick={onAction}>{actionLabel}</Button>
        </div>
      )}
    </section>
  );
}

/* ---------- 오류 (Figma 2.2 [예외] AI 분석 실패) ---------- */
type ErrorStateProps = {
  /** 제목. 예전처럼 message만 넘겨도 제목으로 보여요 (API error.message) */
  title?: ReactNode;
  message?: ReactNode;
  /** 제목 아래 설명. 두 줄이면 "첫 줄\n둘째 줄" */
  description?: ReactNode;
  onRetry?: () => void;
  retryLabel?: string;
  /** 두 번째 버튼 (예: "기록 목록으로 돌아가기") */
  secondaryLabel?: string;
  onSecondary?: () => void;
};

export function ErrorState({
  title,
  message,
  description,
  onRetry,
  retryLabel = "다시 시도",
  secondaryLabel,
  onSecondary,
}: ErrorStateProps) {
  return (
    <section role="alert" className="flex flex-col items-center gap-3.5 px-6 py-10 text-center">
      <Halo>
        <AlertIcon size={44} />
      </Halo>
      <StateText title={title ?? message ?? "문제가 생겼어요"} description={description} />
      {(onRetry || onSecondary) && (
        <div className="mt-6 flex w-full flex-col gap-3">
          {onRetry && <Button onClick={onRetry}>{retryLabel}</Button>}
          {secondaryLabel && onSecondary && (
            <Button variant="outline" onClick={onSecondary}>
              {secondaryLabel}
            </Button>
          )}
        </div>
      )}
    </section>
  );
}
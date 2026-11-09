"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Header, Chip, EmptyState, ErrorState, LoadingState, Modal } from "@/components/common";
import { LockIcon } from "@/components/icons/Icons";
import { DOCUMENT_TYPE_LABEL } from "@/constants/labels";
import { useShareHistory } from "@/hooks/useShare";
import { getErrorMessage } from "@/lib/api/client";
import { revokeShare, type ShareHistoryItem, type ShareStatus } from "@/lib/api/share";
import { formatDate } from "@/lib/format";

const STATUS: Record<Exclude<ShareStatus, "DRAFT">, { label: string; tone: "mint" | "neutral" | "pink" }> = {
  ACTIVE: { label: "공유 중", tone: "mint" },
  EXPIRED: { label: "만료", tone: "neutral" },
  REVOKED: { label: "중지됨", tone: "pink" },
};

/** 4.3 공유 내역·접근 중지 (SHARE-04·05, Figma 디자인 없음 → 3.1·4.1 스타일) */
export default function ShareHistoryPage() {
  const { state, retry } = useShareHistory();

  if (state.phase === "loading") {
    return (
      <main className="flex flex-col pb-[120px]">
        <Header title="공유 내역" back />
        <LoadingState count={3} label="공유 내역을 불러오는 중이에요" />
      </main>
    );
  }
  if (state.phase === "error") {
    return (
      <main className="flex flex-col pb-[120px]">
        <Header title="공유 내역" back />
        <ErrorState message={getErrorMessage(state.error)} onRetry={retry} />
      </main>
    );
  }
  // 초안(DRAFT)은 명세상 내역에 나오지 않지만, 혹시 오면 걸러냄
  return <ShareHistoryList initial={state.data.shares.filter((s) => s.status !== "DRAFT")} />;
}

function ShareHistoryList({ initial }: { initial: ShareHistoryItem[] }) {
  const router = useRouter();
  const [items, setItems] = useState<ShareHistoryItem[]>(initial);
  const [target, setTarget] = useState<ShareHistoryItem | null>(null);
  const [revoking, setRevoking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** SHARE-05: 실패하면 서버 문구 (예: SHARE_ALREADY_INACTIVE, SHARE_FORBIDDEN) */
  const handleRevoke = async () => {
    if (!target) return;
    setRevoking(true);
    setError(null);
    try {
      await revokeShare(target.shareId);
      setItems((prev) =>
        prev.map((it) => (it.shareId === target.shareId ? { ...it, status: "REVOKED", revocable: false } : it)),
      );
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setRevoking(false);
      setTarget(null);
    }
  };

  return (
    <main className="flex flex-col pb-[120px]">
      <Header title="공유 내역" subtitle="보낸 링크를 확인하고 접근을 막을 수 있어요" back />

      <div className="flex flex-col gap-6 px-6">
        {error && <p className="rounded-input bg-pink-soft px-4 py-3 text-body font-bold text-pink-strong">{error}</p>}

        {items.length === 0 ? (
          <EmptyState
            title="아직 공유한 문서가 없어요"
            description="돌봄 설명서를 공유하면 여기에서 확인할 수 있어요."
            actionLabel="설명서 공유하기"
            onAction={() => router.push("/share?documentType=GUIDE")}
          />
        ) : (
          <ul className="flex flex-col gap-3">
            {items.map((it) => {
              const status = STATUS[it.status as Exclude<ShareStatus, "DRAFT">];
              return (
                <li key={it.shareId} className="flex flex-col gap-2 rounded-card bg-bg-surface px-4 py-3.5">
                  <div className="flex items-center gap-2">
                    <Chip tone={status.tone}>{status.label}</Chip>
                    <span className="text-caption font-bold text-text-secondary">
                      {DOCUMENT_TYPE_LABEL[it.documentType]}
                    </span>
                  </div>
                  <p
                    className={`text-body font-bold leading-[1.45] ${
                      it.recipientLabel ? "text-text-primary" : "text-text-tertiary"
                    }`}
                  >
                    {it.recipientLabel ?? "받는 사람 메모 없음"}
                  </p>
                  <p className="text-caption text-text-secondary">
                    {it.createdByName}님이 공유 · {formatDate(it.approvedAt)} ~ {formatDate(it.expiresAt)}
                  </p>
                  {it.status === "ACTIVE" && it.revocable && (
                    <button
                      type="button"
                      onClick={() => setTarget(it)}
                      className="mt-1 h-10 self-end rounded-input border-[1.5px] border-line-strong px-3.5 text-caption font-bold text-pink-strong active:opacity-70"
                    >
                      접근 중지
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        <p className="flex items-start gap-1.5 text-caption font-medium leading-[1.45] text-text-tertiary">
          <LockIcon size={16} className="shrink-0" />
          링크 주소는 보안을 위해 다시 보여 드리지 않아요
        </p>
      </div>

      <Modal
        open={target !== null}
        tone="danger"
        title="이 링크의 접근을 중지할까요?"
        message="중지하면 받은 분이 더 이상 볼 수 없어요. 다시 열 수 없어요."
        confirmLabel="접근 중지"
        loading={revoking}
        onClose={() => setTarget(null)}
        onConfirm={handleRevoke}
      />
    </main>
  );
}
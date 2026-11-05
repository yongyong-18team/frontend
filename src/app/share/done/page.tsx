"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, EmptyState, LoadingState, Modal } from "@/components/common";
import { CheckIcon, InfoIcon } from "@/components/icons/Icons";
import { DOCUMENT_TYPE_LABEL } from "@/constants/labels";
import { copyText } from "@/lib/clipboard";
import { formatDateTime } from "@/lib/format";
import { clearIssuedShare, useIssuedShare } from "@/lib/shareDraft";

/** 4.3 링크 발급 완료 (Figma 디자인 없음 → 3.1·4.1 스타일)
 *  shareUrl은 SHARE-03 응답에서만 받을 수 있어서, 이 화면을 떠나면 다시 볼 수 없다.
 */
export default function ShareDonePage() {
  const router = useRouter();
  const issued = useIssuedShare();
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);
  const [leaveTo, setLeaveTo] = useState<string | null>(null);

  if (issued === undefined) return <LoadingState />;

  if (issued === null) {
    return (
      <main className="flex flex-col px-6 pb-[120px] pt-6">
        <EmptyState
          title="보여 드릴 링크가 없어요"
          description="링크는 만든 직후에만 복사할 수 있어요. 공유 내역에서 상태를 확인할 수 있어요."
          actionLabel="공유 내역 보기"
          onAction={() => router.push("/share/history")}
        />
      </main>
    );
  }

  const { approve, recipientLabel } = issued;

  const handleCopy = async () => {
    const ok = await copyText(approve.shareUrl);
    setCopied(ok);
    setCopyFailed(!ok);
  };

  const leave = (to: string) => {
    clearIssuedShare();
    router.push(to);
  };

  /** 복사 안 했으면 한 번 확인 */
  const tryLeave = (to: string) => (copied ? leave(to) : setLeaveTo(to));

  return (
    <main className="flex flex-col pb-[120px]">
      {/* 완료 안내 */}
      <section className="flex flex-col items-center gap-3 px-6 pb-6 pt-10 text-center">
        <span className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-primary-soft text-primary-strong">
          <CheckIcon size={32} />
        </span>
        <div className="flex flex-col gap-1">
          <h1 className="text-title font-bold text-text-primary">공유 링크를 만들었어요</h1>
          <p className="text-body leading-[1.45] text-text-secondary">받는 분에게 링크를 보내 주세요</p>
        </div>
      </section>

      <div className="flex flex-col gap-6 px-6">
        {/* 링크 + 복사 */}
        <section className="flex flex-col gap-3 rounded-card bg-bg-surface p-4">
          <p className="select-all break-all rounded-input bg-bg-subtle px-4 py-3 text-body font-medium leading-[1.5] text-text-primary">
            {approve.shareUrl}
          </p>
          <Button onClick={handleCopy}>{copied ? "복사했어요 ✓" : "링크 복사"}</Button>
          {copyFailed && (
            <p className="text-caption text-pink-strong">복사하지 못했어요. 위 링크를 길게 눌러 직접 복사해 주세요.</p>
          )}
        </section>

        {/* API notice 그대로 */}
        <p className="flex items-center gap-2 rounded-[12px] bg-peach-soft px-3.5 py-2.5 text-[14px] font-bold leading-[1.45] text-peach-strong">
          <InfoIcon size={16} className="shrink-0" />
          {approve.notice}
        </p>

        {/* 문서 정보 */}
        <section className="flex flex-col gap-2.5 rounded-card bg-bg-surface px-4 py-3.5">
          <h2 className="text-body font-bold text-text-primary">문서 정보</h2>
          <dl className="grid grid-cols-[72px_1fr] gap-x-3 gap-y-2 text-body leading-[1.45]">
            <dt className="text-text-secondary">문서</dt>
            <dd className="text-text-primary">{DOCUMENT_TYPE_LABEL[approve.documentType]}</dd>
            {recipientLabel && (
              <>
                <dt className="text-text-secondary">받는 사람</dt>
                <dd className="text-text-primary">{recipientLabel}</dd>
              </>
            )}
            <dt className="text-text-secondary">만든 날</dt>
            <dd className="text-text-primary">{formatDateTime(approve.approvedAt)}</dd>
            <dt className="text-text-secondary">열람 기한</dt>
            <dd className="text-text-primary">{formatDateTime(approve.expiresAt)}까지</dd>
          </dl>
        </section>

        <div className="flex gap-2">
          <Button variant="outline" onClick={() => tryLeave("/share/history")}>
            공유 내역 보기
          </Button>
          <Button onClick={() => tryLeave("/manual")}>설명서로 돌아가기</Button>
        </div>
      </div>

      {/* 링크 미복사 경고 */}
      <Modal
        open={leaveTo !== null}
        title="링크를 복사하지 않았어요"
        message="이 화면을 나가면 링크를 다시 볼 수 없어요."
        cancelLabel="머무르기"
        confirmLabel="나가기"
        onClose={() => setLeaveTo(null)}
        onConfirm={() => leaveTo && leave(leaveTo)}
      />
    </main>
  );
}
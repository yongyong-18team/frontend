"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Header, Button, Chip, EmptyState, LoadingState } from "@/components/common";
import { LockIcon } from "@/components/icons/Icons";
import SharedDocument from "@/components/share/SharedDocument";
import { DOCUMENT_TYPE_LABEL } from "@/constants/labels";
import { ApiError, getErrorMessage } from "@/lib/api/client";
import { approveShare, type ShareDraftRequest } from "@/lib/api/share";
import { clearShareDraft, saveIssuedShare, useShareDraft } from "@/lib/shareDraft";

/** 4.1로 돌아가는 주소 (들어왔던 문서 유형·기록 그대로) */
function scopeUrl(req: ShareDraftRequest) {
  const q = new URLSearchParams({ documentType: req.documentType });
  if (req.sourceDiaryId !== null) q.set("sourceDiaryId", String(req.sourceDiaryId));
  if (req.periodStart) q.set("periodStart", req.periodStart);
  return `/share?${q.toString()}`;
}

/** 4.2 문서 미리보기 (Figma 디자인 없음 → 3.1·4.1 스타일) */
export default function SharePreviewPage() {
  const router = useRouter();
  const draft = useShareDraft();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<{ code: string; message: string } | null>(null);

  if (draft === undefined) {
    return (
      <main className="flex flex-col pb-[120px]">
        <Header title="문서 미리보기" back />
        <LoadingState />
      </main>
    );
  }

  if (draft === null) {
    return (
      <main className="flex flex-col pb-[120px]">
        <Header title="문서 미리보기" back />
        <div className="px-6">
          <EmptyState
            title="미리볼 문서가 없어요"
            description="공유할 문서와 정보 범위를 먼저 골라 주세요."
            actionLabel="공유 범위 설정하기"
            onAction={() => router.push("/share?documentType=GUIDE")}
          />
        </div>
      </main>
    );
  }

  const { request, response } = draft;
  const { preview } = response;

  /** SHARE-03: 승인 → 링크 발급 (shareUrl은 이 응답에서만) */
  const handleCreateLink = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const approve = await approveShare(response.shareId);
      saveIssuedShare({ approve, recipientLabel: request.recipientLabel });
      clearShareDraft();
      router.push("/share/done");
    } catch (e) {
      // SHARE_NOT_FOUND(초안이 1일 지나 삭제됨)면 아래에서 "공유 범위부터 다시 만들기" 안내
      setError({ code: e instanceof ApiError ? e.code : "", message: getErrorMessage(e) });
      setSubmitting(false);
    }
  };

  return (
    <main className="flex flex-col pb-[120px]">
      <Header title="문서 미리보기" subtitle="공유될 내용을 확인해 주세요." back onBack={() => router.push(scopeUrl(request))} />

      <div className="flex flex-col gap-6 px-6">
        {/* 공유 정보 */}
        <section className="flex flex-col gap-2 rounded-card bg-bg-surface px-4 py-3.5">
          <div className="flex flex-wrap items-center gap-2">
            <Chip tone="primary">{DOCUMENT_TYPE_LABEL[preview.documentType]}</Chip>
            {request.recipientLabel && (
              <span className="text-body font-bold text-text-primary">받는 사람: {request.recipientLabel}</span>
            )}
          </div>
          <p className="text-caption text-text-secondary">생성된 공유 링크는 {response.validDays}일 동안 이용할 수 있어요.</p>
        </section>

        {/* 문서 (받는 분이 보는 모양 그대로) */}
        <SharedDocument
          documentType={preview.documentType}
          basicInfo={preview.basicInfo}
          summaryLines={preview.summaryLines}
          sections={preview.sections}
        />

        <p className="flex items-start gap-1.5 text-caption font-medium leading-[1.45] text-text-tertiary">
          <LockIcon size={16} className="shrink-0" />
          링크를 만든 뒤에 설명서가 바뀌어도 받는 분에게는 이 내용 그대로 보여요
        </p>

        {error && (
          <div className="flex flex-col gap-2 rounded-input bg-pink-soft px-4 py-3">
            <p className="text-body font-bold text-pink-strong">공유 링크를 만들지 못했어요. 다시 시도해 주세요.</p>
            <p className="text-caption text-pink-strong">{error.message}</p>
            {error.code === "SHARE_NOT_FOUND" && (
              <button
                type="button"
                onClick={() => router.push(scopeUrl(request))}
                className="self-start text-caption font-bold text-pink-strong underline"
              >
                공유 범위부터 다시 만들기
              </button>
            )}
          </div>
        )}

        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push(scopeUrl(request))}>
            이전
          </Button>
          <Button onClick={handleCreateLink} disabled={submitting}>
            {submitting ? "공유 링크를 만들고 있어요." : "공유 링크 생성"}
          </Button>
        </div>
      </div>
    </main>
  );
}
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Header, Button, Chip, EmptyState, ErrorState, LoadingState, Modal } from "@/components/common";
import { CheckIcon, LockIcon, MailIcon } from "@/components/icons/Icons";
import { useReceivedInvitations } from "@/hooks/useAccount";
import { getErrorMessage } from "@/lib/api/client";
import { acceptInvitation, rejectInvitation, type ReceivedInvitation } from "@/lib/api/member";
import { setSubjectId } from "@/lib/auth/session";
import { formatDate } from "@/lib/format";

/** 6.2.1 받은 초대 (INVITE-04·05·06) — 한 번에 하나씩, 처리하면 다음 초대 */
export default function InvitationsPage() {
  const { state, retry } = useReceivedInvitations();

  if (state.phase === "loading") {
    return (
      <main className="flex flex-col pb-[120px]">
        <Header title="받은 초대" back />
        <LoadingState count={2} label="받은 초대를 불러오는 중이에요" />
      </main>
    );
  }
  if (state.phase === "error") {
    return (
      <main className="flex flex-col pb-[120px]">
        <Header title="받은 초대" back />
        <ErrorState message={getErrorMessage(state.error)} onRetry={retry} />
      </main>
    );
  }
  return <InvitationsView initial={state.data.invitations} />;
}

function InvitationsView({ initial }: { initial: ReceivedInvitation[] }) {
  const router = useRouter();
  const [list, setList] = useState<ReceivedInvitation[]>(initial);
  const [error, setError] = useState<string | null>(null);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const current = list[0];

  /** 처리된 초대를 빼고 다음으로 */
  const next = () => setList((prev) => prev.slice(1));

  /** INVITE-05 수락 → 받은 대상자를 현재 대상자로 저장하고 홈으로 */
  const handleAccept = async () => {
    if (!current) return;
    setBusy(true);
    setError(null);
    try {
      const { subjectId } = await acceptInvitation(current.invitationId);
      setSubjectId(subjectId);
      router.push("/home");
    } catch (e) {
      // 예) INVITE_NOT_PENDING(보낸 사람이 취소함) → 문구 보여 주고 다음 초대로
      setError(getErrorMessage(e));
      next();
      setBusy(false);
    }
  };

  /** INVITE-06 거절 */
  const handleReject = async () => {
    if (!current) return;
    setRejectOpen(false);
    setBusy(true);
    setError(null);
    try {
      await rejectInvitation(current.invitationId);
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      next();
      setBusy(false);
    }
  };

  return (
    <main className="flex flex-col pb-[120px]">
      <Header title="받은 초대" subtitle="수락하면 돌봄 정보 조회, 공유, 지원 신청이 가능해요" back />

      {error && (
        <p role="alert" className="mx-6 mb-4 rounded-input bg-pink-soft px-4 py-3 text-caption font-bold text-pink-strong">
          {error}
        </p>
      )}

      {!current ? (
        <EmptyState icon={<MailIcon size={44} />} title="받은 초대가 없어요" />
      ) : (
        <div className="flex flex-col gap-6 px-6">
          {/* 초대 카드 */}
          <section className="flex items-start gap-3.5 rounded-card bg-primary-soft px-5 py-[18px]">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-bg-surface text-primary-strong">
              <MailIcon size={22} />
            </span>
            <div className="flex min-w-0 flex-1 flex-col items-start gap-1">
              {current.createdAt && <Chip tone="primary">{formatDate(current.createdAt)} 도착</Chip>}
              <h2 className="text-[18px] font-bold leading-[1.35] tracking-[-0.27px] text-text-primary">
                {current.subjectName} 돌봄 공동 관리자
              </h2>
              <p className="text-[14px] leading-[1.45] tracking-[-0.21px] text-text-secondary">
                보호자 {current.inviterDisplayName}님이 초대했어요
              </p>
            </div>
          </section>

          {/* 허용 권한 범위 (서버 고정 문구) */}
          <section className="flex flex-col gap-3">
            <h2 className="text-subhead font-bold text-text-primary">허용 권한 범위</h2>
            <ul className="flex flex-col divide-y divide-line-base rounded-card bg-bg-surface px-4 py-1">
              {current.permissions.map((p) => (
                <li key={p} className="flex items-center gap-3 py-3.5">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-mint-soft text-mint-strong" aria-hidden>
                    <CheckIcon size={16} />
                  </span>
                  <span className="min-w-0 flex-1 text-body font-medium leading-[1.45] text-text-primary">{p}</span>
                </li>
              ))}
            </ul>
          </section>

          {current.restrictedItems.length > 0 && (
            <p className="flex items-start gap-1.5 text-caption font-medium leading-[1.45] text-text-tertiary">
              <LockIcon size={16} className="shrink-0" />
              수락해도 볼 수 없어요: {current.restrictedItems.join(", ")}
            </p>
          )}

          <div className="flex flex-col gap-2.5">
            <Button onClick={handleAccept} disabled={busy}>
              {busy ? "처리 중..." : "초대 수락"}
            </Button>
            <Button variant="outline" onClick={() => setRejectOpen(true)} disabled={busy}>
              거절하기
            </Button>
          </div>
        </div>
      )}

      {/* 거절 확인 (INVITE-06) */}
      <Modal
        open={rejectOpen}
        title="초대를 거절할까요?"
        message={current ? `${current.subjectName} 돌봄 공동 관리자 초대를 거절해요.` : undefined}
        confirmLabel="거절하기"
        cancelLabel="닫기"
        tone="danger"
        onConfirm={handleReject}
        onClose={() => setRejectOpen(false)}
      />
    </main>
  );
}
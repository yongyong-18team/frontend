"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Header, Button, Chip, EmptyState, ErrorState, LoadingState, Modal } from "@/components/common";
import { InfoIcon, UserIcon, UserMinusIcon } from "@/components/icons/Icons";
import { useMembersPage } from "@/hooks/useAccount";
import { getErrorMessage } from "@/lib/api/client";
import {
  cancelInvitation,
  removeMember,
  type CoManager,
  type SentInvitation,
} from "@/lib/api/member";

/** 공동 관리자 권한은 고정 (표시용) */
const CO_PERMISSIONS = "조회·공유·지원";

/** 작은 버튼 (Figma: 좌우 12·상하 7, 13 Bold) */
const SMALL_BTN = "shrink-0 rounded-full border bg-bg-surface px-3 py-[7px] text-caption font-bold leading-[1.4] active:opacity-70";

/** 6.3 공동 관리자 관리 (OWNER, MEMBER-02·03, INVITE-02·03) */
export default function MembersPage() {
  const { state, retry } = useMembersPage();

  if (state.phase === "loading") {
    return (
      <main className="flex flex-col pb-[120px]">
        <Header title="공동 관리자 관리" back />
        <LoadingState count={2} label="공동 관리자를 불러오는 중이에요" />
      </main>
    );
  }
  if (state.phase === "error") {
    return (
      <main className="flex flex-col pb-[120px]">
        <Header title="공동 관리자 관리" back />
        <ErrorState message={getErrorMessage(state.error)} onRetry={retry} />
      </main>
    );
  }
  if (!state.data.owner || !state.data.members) {
    return (
      <main className="flex flex-col pb-[120px]">
        <Header title="공동 관리자 관리" back />
        <EmptyState title="공동 관리자 관리는 주 보호자만 할 수 있어요" />
      </main>
    );
  }
  return <MembersView initialMembers={state.data.members.coManagers} initialPending={state.data.pending} />;
}

function MembersView({
  initialMembers,
  initialPending,
}: {
  initialMembers: CoManager[];
  initialPending: SentInvitation[];
}) {
  const router = useRouter();
  const [members, setMembers] = useState<CoManager[]>(initialMembers);
  const [pending, setPending] = useState<SentInvitation[]>(initialPending);
  const [removeTarget, setRemoveTarget] = useState<CoManager | null>(null);
  const [cancelTarget, setCancelTarget] = useState<SentInvitation | null>(null);
  const [notice, setNotice] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  /** MEMBER-03 해제 (userId로) → 함께 막힌 공유 링크 수 안내 */
  const handleRemove = async () => {
    if (!removeTarget) return;
    setBusy(true);
    try {
      const { revokedShareCount: n } = await removeMember(removeTarget.userId);
      setMembers((prev) => prev.filter((m) => m.userId !== removeTarget.userId));
      setNotice({ tone: "ok", text: n > 0 ? `해제했어요. 공유 링크 ${n}개도 함께 막혔어요.` : "해제했어요." });
    } catch (e) {
      setNotice({ tone: "error", text: getErrorMessage(e) });
    } finally {
      setBusy(false);
      setRemoveTarget(null);
    }
  };

  /** INVITE-03 대기 중 초대 취소 */
  const handleCancelInvite = async () => {
    if (!cancelTarget) return;
    setBusy(true);
    try {
      await cancelInvitation(cancelTarget.invitationId);
      setPending((prev) => prev.filter((i) => i.invitationId !== cancelTarget.invitationId));
      setNotice({ tone: "ok", text: "초대를 취소했어요." });
    } catch (e) {
      setNotice({ tone: "error", text: getErrorMessage(e) });
    } finally {
      setBusy(false);
      setCancelTarget(null);
    }
  };

  const empty = members.length === 0 && pending.length === 0;

  return (
    <main className="flex flex-col pb-[120px]">
      <Header title="공동 관리자 관리" subtitle="권한을 확인하고 필요하면 해제할 수 있어요" back />

      <div className="flex flex-col gap-6 px-6">
        {notice && (
          <p
            role={notice.tone === "error" ? "alert" : "status"}
            className={`rounded-input px-4 py-3 text-caption font-bold ${
              notice.tone === "error" ? "bg-pink-soft text-pink-strong" : "bg-mint-soft text-mint-strong"
            }`}
          >
            {notice.text}
          </p>
        )}

        {/* 공동 관리자 목록 */}
        <section className="flex flex-col gap-3">
          <h2 className="text-subhead font-bold text-text-primary">공동 관리자 목록</h2>
          <div className="flex flex-col divide-y divide-line-base rounded-card bg-bg-surface px-4 py-1">
            {empty && <p className="py-3.5 text-body text-text-tertiary">아직 공동 관리자가 없어요</p>}

            {members.map((m) => (
              <div key={m.userId} className="flex items-center gap-3 py-3.5">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-mint-soft text-mint-strong">
                  <UserIcon size={20} />
                </span>
                <div className="flex min-w-0 flex-1 flex-col gap-[3px]">
                  <span className="flex items-center gap-1.5">
                    <span className="truncate text-body font-bold leading-[1.45] text-text-primary">
                      {m.loginId ?? m.displayName}
                    </span>
                    <Chip tone="mint">관리자</Chip>
                  </span>
                  <span className="text-caption text-text-secondary">
                    {m.displayName} · {CO_PERMISSIONS}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setRemoveTarget(m)}
                  className={`${SMALL_BTN} border-pink-strong text-pink-strong`}
                >
                  해제
                </button>
              </div>
            ))}

            {pending.map((inv) => (
              <div key={inv.invitationId} className="flex items-center gap-3 py-3.5">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-peach-soft text-peach-strong">
                  <UserIcon size={20} />
                </span>
                <div className="flex min-w-0 flex-1 flex-col gap-[3px]">
                  <span className="flex items-center gap-1.5">
                    <span className="truncate text-body font-bold leading-[1.45] text-text-primary">
                      {inv.inviteeLoginId}
                    </span>
                    <Chip tone="peach">대기 중</Chip>
                  </span>
                  <span className="text-caption text-text-secondary">초대 수락 대기 중</span>
                </div>
                {inv.status === "PENDING" && (
                  <button
                    type="button"
                    onClick={() => setCancelTarget(inv)}
                    className={`${SMALL_BTN} border-line-strong text-text-secondary`}
                  >
                    초대 취소
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>

        <p className="flex items-start gap-1.5 text-caption font-medium leading-[1.45] text-text-tertiary">
          <InfoIcon size={16} className="shrink-0" />
          해제해도 언제든 다시 초대할 수 있어요.
        </p>

        <Button variant="soft" onClick={() => router.push("/settings/invite")}>
          + 공동 관리자 초대
        </Button>
      </div>

      {/* 해제 확인 (MEMBER-03) — Figma 6.4 [상태] */}
      <Modal
        open={!!removeTarget}
        icon={<UserMinusIcon size={26} />}
        title={removeTarget ? `${removeTarget.loginId ?? removeTarget.displayName}님의 권한을 해제할까요?` : ""}
        message={
          <>
            해제하면 돌봄 정보를 더 이상 볼 수 없어요.
            <br />
            언제든 다시 초대할 수 있어요.
            <br />
            이분이 만든 공유 링크도 함께 막혀요.
          </>
        }
        confirmLabel="해제"
        cancelLabel="취소"
        tone="danger"
        loading={busy}
        onConfirm={handleRemove}
        onClose={() => setRemoveTarget(null)}
      />

      {/* 초대 취소 확인 (INVITE-03) */}
      <Modal
        open={!!cancelTarget}
        title="초대를 취소할까요?"
        message={cancelTarget ? `${cancelTarget.inviteeLoginId}님에게 보낸 초대가 취소돼요.` : undefined}
        confirmLabel="초대 취소"
        cancelLabel="닫기"
        tone="danger"
        loading={busy}
        onConfirm={handleCancelInvite}
        onClose={() => setCancelTarget(null)}
      />
    </main>
  );
}
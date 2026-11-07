"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Header, Button, Chip, ListRow, Modal, BottomSheet } from "@/components/common";
import { CopyIcon, MailIcon, SettingsIcon, UserIcon, UserPlusIcon, UsersIcon } from "@/components/icons/Icons";
import { copyText } from "@/lib/clipboard";
import {
  RELATION_LABEL,
  mockMe,
  mockMembers,
  mockSentInvitations,
  type SentInvitation,
} from "@/mocks/account";

/** 공동 관리자 권한은 고정 (표시용) */
const CO_PERMISSIONS = "조회·공유·지원";

/** 6.1 마이페이지 */
export default function SettingsPage() {
  const router = useRouter();
  // TODO(D4): USER-01, MEMBER-02, INVITE-02 API로 교체
  const me = mockMe;
  const members = mockMembers;
  const isOwner = me.subjects[0]?.role === "OWNER";

  const [pending, setPending] = useState<SentInvitation[]>(() =>
    mockSentInvitations.filter((i) => i.status === "PENDING"),
  );
  const [copied, setCopied] = useState(false);
  const [cancelTarget, setCancelTarget] = useState<SentInvitation | null>(null);
  const [accountOpen, setAccountOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);

  const handleCopy = async () => {
    if (await copyText(me.loginId)) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCancelInvite = () => {
    if (!cancelTarget) return;
    // TODO(D4): INVITE-03 대기 중 초대 취소. 실패하면 error.message 표시
    console.log("INVITE-03 취소", cancelTarget.invitationId);
    setPending((prev) => prev.filter((i) => i.invitationId !== cancelTarget.invitationId));
    setCancelTarget(null);
  };

  const handleLogout = () => {
    // TODO(프론트 A): 토큰 삭제 후 0.1로
    setAccountOpen(false);
    router.push("/login");
  };

  const handleWithdraw = () => {
    // TODO(D4): USER-03 탈퇴 → 토큰 삭제 후 0.1로
    console.log("USER-03 탈퇴");
    setWithdrawOpen(false);
    router.push("/login");
  };

  const empty = members.coManagers.length === 0 && pending.length === 0;

  return (
    <main className="flex flex-col pb-[120px]">
      <Header title="마이페이지" />

      <div className="flex flex-col gap-7 px-6">
        {/* 프로필 */}
        <section className="flex items-center gap-3.5 rounded-card bg-bg-surface px-[18px] py-4">
          <span className="flex h-[60px] w-[60px] shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary-strong">
            <UserIcon size={30} />
          </span>
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="truncate text-[19px] font-bold leading-[1.35] tracking-[-0.285px] text-text-primary">
                {me.displayName}
              </span>
              <Chip tone="primary">보호자 · {RELATION_LABEL[me.relation]}</Chip>
            </div>
            <button
              type="button"
              onClick={handleCopy}
              aria-label="아이디 복사"
              className="flex items-center gap-1.5 self-start text-[14px] font-medium leading-[1.45] tracking-[-0.21px] text-text-secondary"
            >
              ID · {me.loginId}
              <CopyIcon size={16} className="shrink-0" />
              {copied && <span className="text-caption font-bold text-mint-strong">복사했어요</span>}
            </button>
          </div>
        </section>

        {/* 공동 관리자 */}
        <section className="flex flex-col gap-3">
          <div className="flex flex-col gap-0.5">
            <h2 className="text-subhead font-bold text-text-primary">공동 관리자</h2>
            <p className="text-caption text-text-tertiary">승인된 가족 계정</p>
          </div>
          <div className="flex flex-col divide-y divide-line-base rounded-card bg-bg-surface px-4 py-1">
            {empty && <p className="py-3.5 text-body text-text-tertiary">아직 공동 관리자가 없어요</p>}

            {members.coManagers.map((m) => (
              <div key={m.loginId} className="flex items-center gap-3 py-3.5">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-mint-soft text-mint-strong">
                  <UserIcon size={20} />
                </span>
                <div className="flex min-w-0 flex-1 flex-col gap-[3px]">
                  <span className="flex items-center gap-1.5">
                    <span className="truncate text-body font-bold leading-[1.45] text-text-primary">{m.loginId}</span>
                    <Chip tone="mint">관리자</Chip>
                  </span>
                  <span className="text-caption text-text-secondary">
                    {m.displayName} · {CO_PERMISSIONS}
                  </span>
                </div>
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
                  <span className="text-caption text-text-secondary">초대 수락을 기다리고 있어요</span>
                </div>
                {isOwner && (
                  <button
                    type="button"
                    onClick={() => setCancelTarget(inv)}
                    className="-mr-2 flex h-11 shrink-0 items-center px-2 text-caption font-bold text-text-tertiary"
                  >
                    취소
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* 설정 및 관리 */}
        <section className="flex flex-col gap-3">
          <h2 className="text-subhead font-bold text-text-primary">설정 및 관리</h2>
          <div className="flex flex-col divide-y divide-line-base rounded-card bg-bg-surface px-4 py-1">
            {isOwner && (
              <ListRow
                size="lg"
                href="/settings/members"
                icon={<UsersIcon size={22} />}
                iconTone="mint"
                title="공동 관리자 관리"
                description={`현재 ${members.coManagers.length}명`}
              />
            )}
            {isOwner && (
              <ListRow
                size="lg"
                href="/settings/invite"
                icon={<UserPlusIcon size={22} />}
                iconTone="primary"
                title="공동 관리자 초대"
                description="ID로 초대"
              />
            )}
            <ListRow
              size="lg"
              href="/settings/invitations"
              icon={<MailIcon size={22} />}
              iconTone="sky"
              title={
                <span className="flex items-center gap-1.5">
                  받은 초대 확인
                  {me.pendingInvitationCount > 0 && <Chip tone="pink">새 초대 {me.pendingInvitationCount}</Chip>}
                </span>
              }
              description="요청 내역"
            />
            <ListRow
              size="lg"
              onClick={() => setAccountOpen(true)}
              icon={<SettingsIcon size={22} />}
              iconTone="peach"
              title="계정 및 개인정보"
              description="기본 설정"
            />
          </div>
        </section>
      </div>

      {/* 대기 중 초대 취소 확인 (INVITE-03) */}
      <Modal
        open={!!cancelTarget}
        title="초대를 취소할까요?"
        message={cancelTarget ? `${cancelTarget.inviteeLoginId}님에게 보낸 초대가 취소돼요.` : undefined}
        confirmLabel="초대 취소"
        cancelLabel="닫기"
        tone="danger"
        onConfirm={handleCancelInvite}
        onClose={() => setCancelTarget(null)}
      />

      {/* 계정 및 개인정보: 로그아웃 / 탈퇴 */}
      <BottomSheet open={accountOpen} title="계정 및 개인정보" onClose={() => setAccountOpen(false)}>
        <div className="flex flex-col gap-3">
          <Button variant="outline" onClick={handleLogout}>
            로그아웃
          </Button>
          <button
            type="button"
            onClick={() => {
              setAccountOpen(false);
              setWithdrawOpen(true);
            }}
            className="h-12 text-body font-bold text-pink-strong active:opacity-70"
          >
            회원 탈퇴
          </button>
        </div>
      </BottomSheet>

      {/* 탈퇴 확인 (USER-03) */}
      <Modal
        open={withdrawOpen}
        title="정말 탈퇴할까요?"
        message="탈퇴하면 계정을 되돌릴 수 없어요."
        confirmLabel="탈퇴하기"
        cancelLabel="닫기"
        tone="danger"
        onConfirm={handleWithdraw}
        onClose={() => setWithdrawOpen(false)}
      />
    </main>
  );
}
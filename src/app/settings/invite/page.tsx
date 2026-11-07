"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Header, Button, Input, EmptyState } from "@/components/common";
import { CheckIcon, InfoIcon, LockIcon, UserIcon } from "@/components/icons/Icons";
import { mockLookupUser, mockMe, mockSendInvite } from "@/mocks/account";

/** 공동 관리자 권한 (고정, 표시용 — 고르지 않고 요청에도 안 보냄) */
const PERMISSIONS = [
  { title: "조회", description: "돌봄 설명서·리포트 열람" },
  { title: "공유", description: "돌봄 문서 공유 링크 만들기" },
  { title: "돌봄 지원", description: "돌봄 공백 등록·지원 탐색" },
];

/** 6.2 공동 관리자 초대 (OWNER) */
export default function InvitePage() {
  const router = useRouter();
  // TODO(D4): USER-01 role
  const isOwner = mockMe.subjects[0]?.role === "OWNER";

  const [loginId, setLoginId] = useState("");
  const [found, setFound] = useState<{ loginId: string; displayName: string } | null>(null);
  const [error, setError] = useState<{ code: string; message: string } | null>(null);
  const [sending, setSending] = useState(false);

  const handleChange = (v: string) => {
    setLoginId(v);
    setFound(null); // ID를 고치면 다시 확인
    setError(null);
  };

  const handleLookup = () => {
    const id = loginId.trim();
    if (!id) {
      setError({ code: "REQUIRED", message: "상대 계정 ID를 입력해 주세요." });
      return;
    }
    // TODO(D4): MEMBER-01 GET /users/lookup?loginId= (분당 10회, 429면 error.message 표시)
    const res = mockLookupUser(id);
    if (res.ok) {
      setFound(res.data);
      setError(null);
    } else {
      setFound(null);
      setError(res.error);
    }
  };

  const handleInvite = () => {
    if (!found) return;
    setSending(true);
    // TODO(D4): INVITE-01 POST { inviteeLoginId } (권한 값은 보내지 않음)
    const res = mockSendInvite(found.loginId);
    setSending(false);
    if (!res.ok) {
      setFound(null);
      setError(res.error);
      return;
    }
    console.log("INVITE-01 성공", res.data);
    router.push("/settings");
  };

  if (!isOwner) {
    return (
      <main className="flex flex-col pb-[120px]">
        <Header title="공동 관리자 초대" back />
        <EmptyState title="공동 관리자 초대는 주 보호자만 할 수 있어요" />
      </main>
    );
  }

  const notFound = error?.code === "USER_NOT_FOUND" || error?.code === "INVITE_USER_NOT_FOUND";

  return (
    <main className="flex flex-col pb-[120px]">
      <Header title="공동 관리자 초대" subtitle="가족이 가입한 계정 ID로 초대할 수 있어요" back />

      <div className="flex flex-col gap-6 px-6">
        {/* 초대할 계정 */}
        <section className="flex flex-col gap-3.5 rounded-card bg-bg-surface px-[18px] py-4">
          <span className="text-caption font-bold leading-[1.45] text-primary-strong">초대할 계정</span>

          <div className="flex items-start gap-2">
            <div className="min-w-0 flex-1">
              <Input
                label="상대 계정 ID"
                required
                value={loginId}
                autoCapitalize="none"
                autoComplete="off"
                error={error?.message}
                onChange={(e) => handleChange(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLookup()}
              />
            </div>
            {/* 라벨 높이만큼 내려서 입력칸과 맞춤 (Figma pt 30) */}
            <div className="shrink-0 pt-[30px]">
              <Button variant="soft" fullWidth={false} className="w-[76px] px-0" onClick={handleLookup}>
                확인
              </Button>
            </div>
          </div>

          {notFound && (
            <p className="flex items-start gap-1.5 text-caption font-medium leading-[1.45] text-text-tertiary">
              <InfoIcon size={16} className="shrink-0" />
              상대방이 가입할 때 만든 ID를 입력해 주세요
            </p>
          )}

          {found && (
            <div className="flex items-center gap-3 rounded-input bg-mint-soft px-3.5 py-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-mint-base text-mint-strong">
                <UserIcon size={18} />
              </span>
              <div className="flex min-w-0 flex-1 flex-col gap-0.5 leading-[1.45]">
                <span className="truncate text-body font-bold text-text-primary">{found.loginId}</span>
                <span className="text-caption font-medium text-mint-strong">{found.displayName}님 계정을 확인했어요</span>
              </div>
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-mint-strong text-text-on-primary">
                <CheckIcon size={14} />
              </span>
            </div>
          )}
        </section>

        {/* 허용 권한 (표시용) */}
        <section className="flex flex-col gap-3">
          <h2 className="text-subhead font-bold text-text-primary">허용 권한</h2>
          <ul className="flex flex-col divide-y divide-line-base rounded-card bg-bg-surface px-4 py-1">
            {PERMISSIONS.map((p) => (
              <li key={p.title} className="flex items-center gap-3 py-3.5">
                <span
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-[7px] bg-primary-strong text-text-on-primary"
                  aria-hidden
                >
                  <CheckIcon size={14} />
                </span>
                <div className="flex min-w-0 flex-1 flex-col gap-0.5 leading-[1.45]">
                  <span className="text-body font-bold text-text-primary">{p.title}</span>
                  <span className="text-caption text-text-tertiary">{p.description}</span>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <p className="flex items-start gap-1.5 text-caption font-medium leading-[1.45] text-text-tertiary">
          <LockIcon size={16} className="shrink-0" />
          일기 원문과 보호자 감정 기록은 공동 관리자도 볼 수 없어요
        </p>

        <Button onClick={handleInvite} disabled={!found || sending}>
          {sending ? "보내는 중..." : "초대 보내기"}
        </Button>
      </div>
    </main>
  );
}
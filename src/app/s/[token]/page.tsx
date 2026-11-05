import type { Metadata } from "next";
import Image from "next/image";
import type { ReactNode } from "react";
import { AlertIcon, InfoIcon, LockIcon } from "@/components/icons/Icons";
import SharedDocument from "@/components/share/SharedDocument";
import ReloadButton from "@/components/share/ReloadButton";
import { formatDate, formatDateTime } from "@/lib/format";
import { mockPublicShare } from "@/mocks/share";

/** 공유 링크가 검색엔진에 잡히거나 다른 사이트로 주소가 새지 않게 (TRD·API PUB-01) */
export const metadata: Metadata = {
  title: "공유된 돌봄 정보",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

/** 오류별 화면 (설명은 API error.message 그대로) */
const ERROR_VIEW: Record<string, { title: string; icon: ReactNode; tone: string; extra?: string }> = {
  SHARE_EXPIRED: { title: "열람 기한이 지났어요", icon: <AlertIcon size={40} />, tone: "bg-peach-soft text-peach-strong" },
  SHARE_REVOKED: { title: "볼 수 없는 링크예요", icon: <LockIcon size={40} />, tone: "bg-pink-soft text-pink-strong" },
  SHARE_NOT_FOUND: {
    title: "링크를 찾을 수 없어요",
    icon: <AlertIcon size={40} />,
    tone: "bg-bg-subtle text-text-secondary",
    extra: "받은 주소가 끝까지 복사됐는지 확인해 주세요.",
  },
  COMMON_TOO_MANY_REQUESTS: { title: "잠시 후 다시 열어 주세요", icon: <InfoIcon size={40} />, tone: "bg-sky-soft text-sky-strong" },
};
const SERVER_ERROR = { title: "문서를 불러오지 못했어요", icon: <InfoIcon size={40} />, tone: "bg-bg-subtle text-text-secondary" };

/** 로고만 (누를 수 없음 — 받는 분이 서비스 안으로 들어갈 길 없음) */
function Brand() {
  return (
    <div className="flex items-center gap-2">
      <Image src="/images/logo.png" alt="" width={28} height={28} className="rounded-[8px]" />
      <span className="text-body font-bold text-text-primary">돌봄 바통</span>
    </div>
  );
}

/** 4.4 수신자 페이지 — 로그인·하단 탭·버튼 없음, 보기만 (Figma 디자인 없음 → 3.1 스타일) */
export default async function ReceiverPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  // TODO(D4): PUB-01 API로 교체 (GET /api/v1/public/shares/{token}) — 로그인 토큰 보내지 않음, 401이어도 로그인 화면으로 보내지 않음
  const result = mockPublicShare(token);

  if (!result.ok) {
    const view = ERROR_VIEW[result.error.code] ?? SERVER_ERROR;
    const isServerError = !ERROR_VIEW[result.error.code];
    return (
      <main className="flex min-h-[100dvh] flex-col px-6 pb-10 pt-6">
        <Brand />
        <section className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
          <span className={`flex h-20 w-20 items-center justify-center rounded-full ${view.tone}`}>{view.icon}</span>
          <div className="flex flex-col gap-1.5">
            <h1 className="text-heading font-bold text-text-primary">{view.title}</h1>
            <p className="text-body leading-[1.5] text-text-secondary">{result.error.message}</p>
            {view.extra && <p className="text-caption text-text-tertiary">{view.extra}</p>}
          </div>
          {isServerError && <ReloadButton />}
        </section>
      </main>
    );
  }

  const { data } = result;

  return (
    <main className="flex flex-col gap-6 px-6 pb-10 pt-6">
      <Brand />

      <div className="flex flex-col gap-1">
        <h1 className="text-title font-bold text-text-primary">공유된 돌봄 정보</h1>
        <p className="text-body leading-[1.45] text-text-secondary">보호자가 공유한 내용이에요</p>
      </div>

      <section className="rounded-card bg-bg-surface px-4 py-3.5">
        <dl className="grid grid-cols-[72px_1fr] gap-x-3 gap-y-2 text-body leading-[1.45]">
          <dt className="text-text-secondary">공유한 날</dt>
          <dd className="text-text-primary">{formatDate(data.sharedAt)}</dd>
          <dt className="text-text-secondary">열람 기한</dt>
          <dd className="text-text-primary">{formatDateTime(data.expiresAt)}까지</dd>
        </dl>
      </section>

      <SharedDocument
        documentType={data.documentType}
        basicInfo={data.content.basicInfo}
        summaryLines={data.content.summaryLines}
        sections={data.content.sections}
      />

      <p className="flex items-start gap-1.5 text-caption font-medium leading-[1.45] text-text-tertiary">
        <InfoIcon size={16} className="shrink-0" />
        이 문서는 보호자가 승인한 내용만 담고 있어요. 궁금한 점은 보호자에게 직접 물어봐 주세요.
      </p>
    </main>
  );
}
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Header, Chip, ErrorState, LoadingState } from "@/components/common";
import { BuildingIcon, ChatIcon, ExternalLinkIcon, InfoIcon, MapPinIcon, PhoneIcon } from "@/components/icons/Icons";
import { useResourceDetail } from "@/hooks/useSupport";
import { ApiError, getErrorMessage } from "@/lib/api/client";
import type { ResourceDetail } from "@/lib/api/resource";

/** 5.2와 같은 표시: 시설 = 건물·하늘 / 제도 = 말풍선·민트 */
const KIND_STYLE = {
  FACILITY: { label: "시설", tone: "sky", box: "bg-sky-soft text-sky-strong", Icon: BuildingIcon },
  PROGRAM: { label: "제도", tone: "mint", box: "bg-mint-soft text-mint-strong", Icon: ChatIcon },
} as const;

/** 지원 정보 목록 (시설: 시설 유형·제공 서비스 / 제도: 지원 대상·지원 내용·신청 방법) */
function infoRows(d: ResourceDetail): { label: string; value: string }[] {
  if (d.kind === "FACILITY") {
    return [
      { label: "시설 유형", value: d.facilityType },
      { label: "제공 서비스", value: d.services },
    ];
  }
  return [
    { label: "지원 대상", value: d.eligibilitySummary },
    { label: "지원 내용", value: d.summary },
    { label: "신청 방법", value: d.procedure },
  ];
}

/** 5.3 기관·제도 상세 (RES-01, 로그인 필요 → 브라우저에서 불러옴) */
export default function SupportDetailView({ resourceId }: { resourceId: number }) {
  const router = useRouter();
  const { state, retry } = useResourceDetail(resourceId);

  if (state.phase === "loading") {
    return (
      <main className="flex flex-col pb-[120px]">
        <Header title="지원제도 상세 안내" back />
        <LoadingState count={3} label="지원 정보를 불러오는 중이에요" />
      </main>
    );
  }

  if (state.phase === "error") {
    const notFound = state.error instanceof ApiError && state.error.status === 404;
    return (
      <main className="flex flex-col pb-[120px]">
        <Header title="지원제도 상세 안내" back />
        {notFound ? (
          <ErrorState
            title="지원 정보를 찾을 수 없어요"
            description="정보가 바뀌었거나 없어졌을 수 있어요."
            retryLabel="목록으로 돌아가기"
            onRetry={() => router.push("/support/results")}
          />
        ) : (
          <ErrorState message={getErrorMessage(state.error)} onRetry={retry} />
        )}
      </main>
    );
  }

  return <SupportDetailBody detail={state.data} />;
}

function SupportDetailBody({ detail }: { detail: ResourceDetail }) {
  const k = KIND_STYLE[detail.kind];
  const sub = detail.kind === "PROGRAM" ? `출처 · ${detail.sourceDoc}` : detail.facilityType;

  return (
    <main className="flex flex-col pb-[120px]">
      <Header title="지원제도 상세 안내" subtitle="신청 전에 세부 내용을 확인해 주세요" back />

      <div className="flex flex-col gap-6 px-6">
        {/* 기관 정보 */}
        <section className="flex flex-col gap-3.5 rounded-card bg-bg-surface px-[18px] py-4">
          <div className="flex items-start gap-3.5">
            <span className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-[19px] ${k.box}`}>
              <k.Icon size={30} />
            </span>
            <div className="flex min-w-0 flex-1 flex-col items-start gap-1">
              <Chip tone={k.tone}>{k.label}</Chip>
              <h2 className="text-subhead font-bold leading-[1.35] text-text-primary">{detail.name}</h2>
              <p className="text-caption text-text-secondary">{sub}</p>
            </div>
          </div>

          <div className="flex flex-col gap-2.5 border-t border-line-base pt-3.5 text-[14px] font-medium leading-[1.45] tracking-[-0.21px] text-text-primary">
            {detail.kind === "FACILITY" && (
              <p className="flex items-center gap-2">
                <MapPinIcon size={18} className="shrink-0 text-text-secondary" />
                <span className="min-w-0 flex-1">{detail.address}</span>
              </p>
            )}
            <p className="flex items-center gap-2">
              <PhoneIcon size={18} className="shrink-0 text-text-secondary" />
              <span className="min-w-0 flex-1">{detail.phone}</span>
            </p>
            <a
              href={detail.officialUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 font-bold text-primary-strong underline"
            >
              <ExternalLinkIcon size={18} className="shrink-0" />
              <span className="min-w-0 flex-1">공식 안내 페이지 바로가기</span>
            </a>
          </div>
        </section>

        {/* 지원 정보 */}
        <section className="flex flex-col gap-3">
          <h2 className="text-subhead font-bold text-text-primary">지원 정보</h2>
          <div className="flex flex-col divide-y divide-line-base rounded-card bg-bg-surface px-4 py-1">
            {infoRows(detail).map((row) => (
              <div key={row.label} className="flex flex-col gap-1 py-3.5">
                <span className="text-caption font-bold leading-[1.45] text-primary-strong">{row.label}</span>
                <span className="text-body font-medium leading-[1.5] text-text-primary">{row.value}</span>
              </div>
            ))}
          </div>
        </section>

        {/* 안내 사항 */}
        <section className="flex flex-col gap-2 rounded-card bg-butter-soft px-[18px] py-4">
          <p className="flex items-center gap-1.5 text-[14px] font-bold leading-[1.45] text-peach-strong">
            <InfoIcon size={16} className="shrink-0" />
            안내 사항
          </p>
          <ul className="text-[14px] leading-[1.6] text-text-primary">
            <li>· 실제 이용 가능 여부와 정원은 기관에 꼭 확인해 주세요.</li>
            <li>· 신청할 때 돌봄 설명서를 함께 전달하면 인계가 쉬워요.</li>
          </ul>
        </section>

        {/* 하단 버튼: 기관에 자동으로 보내는 것 없음 */}
        <div className="flex gap-2">
          <a
            href={`tel:${detail.phone.replace(/[^0-9+]/g, "")}`}
            className="flex h-14 min-w-0 flex-1 items-center justify-center rounded-button border-[1.5px] border-line-strong bg-bg-surface px-5 text-subhead font-bold text-text-primary active:opacity-80"
          >
            전화 문의
          </a>
          <Link
            href="/share?documentType=GUIDE"
            className="flex h-14 min-w-0 flex-1 items-center justify-center rounded-button bg-primary-strong px-5 text-subhead font-bold text-text-on-primary active:opacity-80"
          >
            돌봄 설명서 공유
          </Link>
        </div>
      </div>
    </main>
  );
}
"use client";

import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Header, Button, ListRow, LoadingState, ErrorState } from "@/components/common";
import { BuildingIcon, ChatIcon, CoffeeIcon, HeartIcon, InfoIcon } from "@/components/icons/Icons";
import type { Tone } from "@/components/icons/SectionIcons";
import { useBurnoutGuide } from "@/hooks/useSupport";
import { getErrorMessage } from "@/lib/api/client";
import type { BurnoutGuide } from "@/lib/api/resource";

/** programType → 아이콘·색·설명 (Figma 5.4 문구, 서버가 설명을 주지 않아 임시) */
const PROGRAM_STYLE: Record<string, { icon: ReactNode; tone: Tone; description: string }> = {
  FAMILY_REST: { icon: <CoffeeIcon size={22} />, tone: "peach", description: "보호자 휴식 지원" },
  PARENT_COUNSELING: { icon: <ChatIcon size={22} />, tone: "mint", description: "전문 상담기관 안내" },
  EMERGENCY_CARE: { icon: <BuildingIcon size={22} />, tone: "sky", description: "돌봄 공백 발생 시 연계" },
};
const DEFAULT_STYLE = { icon: <ChatIcon size={22} />, tone: "mint" as Tone, description: "" };

/** 5.4 보호자 휴식 안내 (화면에 "소진" 같은 진단처럼 들리는 단어를 쓰지 않음) */
export default function SupportRestPage() {
  const { state, retry } = useBurnoutGuide();

  if (state.phase === "loading") {
    return (
      <main className="flex flex-col pb-[120px]">
        <Header title="보호자도 돌봄이 필요해요" back />
        <LoadingState count={2} />
      </main>
    );
  }
  if (state.phase === "error") {
    // 공동 관리자 등 권한이 없으면 서버 문구(403) 그대로
    return (
      <main className="flex flex-col pb-[120px]">
        <Header title="보호자도 돌봄이 필요해요" back />
        <ErrorState message={getErrorMessage(state.error)} onRetry={retry} />
      </main>
    );
  }
  return <SupportRestView guide={state.data} />;
}

function SupportRestView({ guide }: { guide: BurnoutGuide }) {
  const router = useRouter();
  const { message, programs } = guide;

  return (
    <main className="flex flex-col pb-[120px]">
      <Header
        title="보호자도 돌봄이 필요해요"
        subtitle="혼자 감당하기 어려운 순간에 활용할 수 있는 지원을 안내해 드려요"
        back
      />

      <div className="flex flex-col gap-6 px-6">
        {/* 공감 카드 */}
        <section className="flex flex-col items-center gap-3 rounded-card bg-peach-soft px-[22px] py-5 text-center">
          <span className="flex h-[104px] w-[104px] items-center justify-center rounded-full bg-primary-base" aria-hidden>
            <span className="flex h-[76px] w-[76px] items-center justify-center rounded-full bg-bg-surface text-primary-strong">
              <HeartIcon size={30} />
            </span>
          </span>
          <h2 className="text-[19px] font-bold leading-[1.35] tracking-[-0.285px] text-text-primary">
            잠시 쉬어가도 괜찮아요
          </h2>
          <div className="text-[14px] leading-[1.55] tracking-[-0.21px] text-text-secondary">
            {message.map((line, i) => (
              <p key={i}>{line}</p>
            ))}
          </div>
        </section>

        {/* 이런 지원 제도가 있어요 (비었으면 숨김) */}
        {programs.length > 0 && (
          <section className="flex flex-col gap-3">
            <h2 className="text-subhead font-bold text-text-primary">이런 지원 제도가 있어요</h2>
            <div className="flex flex-col divide-y divide-line-base rounded-card bg-bg-surface px-4 py-1">
              {programs.map((p) => {
                const s = PROGRAM_STYLE[p.programType] ?? DEFAULT_STYLE;
                return (
                  <ListRow
                    key={p.resourceId}
                    size="lg"
                    href={`/support/${p.resourceId}`}
                    icon={s.icon}
                    iconTone={s.tone}
                    title={p.name}
                    description={s.description || undefined}
                  />
                );
              })}
            </div>
          </section>
        )}

        <p className="flex items-start gap-1.5 text-caption font-medium leading-[1.45] text-text-tertiary">
          <InfoIcon size={16} className="shrink-0" />
          AI는 치료나 전문 상담을 제공하지 않아요.
        </p>

        <Button variant="outline" onClick={() => router.back()}>
          나중에 볼게요
        </Button>
      </div>
    </main>
  );
}
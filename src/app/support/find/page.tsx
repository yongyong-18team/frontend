"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Header, Button, Chip, DatePicker, Radio, Select, LoadingState, ErrorState } from "@/components/common";
import { InfoIcon, MapPinIcon } from "@/components/icons/Icons";
import { DISTRICT_LABEL, type District } from "@/constants/labels";
import { useResourceSearch, useSubjectForSupport } from "@/hooks/useSupport";
import { getErrorMessage } from "@/lib/api/client";
import type { CareTerm } from "@/lib/api/resource";

/** Figma 5.1 라디오 문구 */
const TERMS: { value: CareTerm; label: string; description: string }[] = [
  { value: "SHORT", label: "잠시 돌봄을 맡아줄 곳이 필요해요", description: "입원·경조사 등 단기 공백" },
  { value: "LONG", label: "정기적인 돌봄 지원이 필요해요", description: "주간·방과후 등 반복 돌봄" },
];

const DISTRICT_OPTIONS = (Object.keys(DISTRICT_LABEL) as District[]).map((d) => ({ value: d, label: DISTRICT_LABEL[d] }));

/** 5.1 돌봄 공백 등록 (단기·장기) — 저장 없음, 조건만 5.2로 넘김. 등록 지역은 SUBJ-02 */
export default function SupportFindPage() {
  const { state, retry } = useSubjectForSupport();

  if (state.phase === "loading") {
    return (
      <main className="flex flex-col pb-[120px]">
        <Header title="내 상황에 맞는 돌봄 지원 찾기" back />
        <LoadingState count={2} />
      </main>
    );
  }
  if (state.phase === "error") {
    return (
      <main className="flex flex-col pb-[120px]">
        <Header title="내 상황에 맞는 돌봄 지원 찾기" back />
        <ErrorState message={getErrorMessage(state.error)} onRetry={retry} />
      </main>
    );
  }
  return <SupportFindForm registeredDistrict={state.data.district} />;
}

function SupportFindForm({ registeredDistrict }: { registeredDistrict: District }) {
  const router = useRouter();

  const [careTerm, setCareTerm] = useState<CareTerm | null>(null);
  const [neededDate, setNeededDate] = useState("");
  const [district, setDistrict] = useState<District>(registeredDistrict);
  const [errors, setErrors] = useState<{ careTerm?: string; neededDate?: string }>({});

  // 관련 지원 정보: 유형을 고르면 RES-02(제도만)로 첫 번째 제도를 보여 줌
  const related = useResourceSearch(
    careTerm ? { careTerm, neededDate: neededDate || undefined, district, kind: "PROGRAM" } : null,
  );
  const first = related.state.phase === "done" ? (related.state.data.results[0] ?? null) : null;

  const handleSearch = () => {
    const next: typeof errors = {};
    if (!careTerm) next.careTerm = "어떤 도움이 필요한지 골라 주세요.";
    if (!neededDate) next.neededDate = "필요한 날짜를 선택해 주세요.";
    setErrors(next);
    if (!careTerm || !neededDate) return;

    const q = new URLSearchParams({ careTerm, neededDate, district });
    router.push(`/support/results?${q.toString()}`);
  };

  return (
    <main className="flex flex-col pb-[120px]">
      <Header title="내 상황에 맞는 돌봄 지원 찾기" subtitle="필요한 상황을 선택하면 관련 공공 지원을 안내해 드려요" back />

      <div className="flex flex-col gap-6 px-6">
        {/* 어떤 도움이 필요하신가요? */}
        <section className="flex flex-col gap-3">
          <h2 className="text-subhead font-bold text-text-primary">어떤 도움이 필요하신가요?</h2>
          <div role="radiogroup" className="flex flex-col divide-y divide-line-base rounded-card bg-bg-surface px-4 py-1">
            {TERMS.map((t) => (
              <Radio
                key={t.value}
                name="careTerm"
                value={t.value}
                label={t.label}
                description={t.description}
                checked={careTerm === t.value}
                onChange={() => {
                  setCareTerm(t.value);
                  setErrors((e) => ({ ...e, careTerm: undefined }));
                }}
              />
            ))}
          </div>
          {errors.careTerm && <p className="text-caption text-pink-strong">{errors.careTerm}</p>}
        </section>

        {/* 필요한 날짜 * (칸은 Figma Select 모양, 펼치면 웜 파스텔 달력) */}
        <DatePicker
          label="필요한 날짜"
          required
          value={neededDate}
          disablePast
          error={errors.neededDate}
          onChange={(v) => {
            setNeededDate(v);
            setErrors((er) => ({ ...er, neededDate: undefined }));
          }}
        />

        {/* 지역 * */}
        <div className="flex flex-col gap-2">
          <Select
            label="지역"
            required
            value={district}
            options={DISTRICT_OPTIONS}
            formatSelected={(o) => `용인시 ${o.label}`}
            onChange={(v) => setDistrict(v as District)}
          />
          {district === registeredDistrict && (
            <p className="flex items-start gap-1.5 text-caption font-medium leading-[1.45] text-mint-strong">
              <MapPinIcon size={16} className="shrink-0" />
              등록된 거주지로 자동 입력했어요
            </p>
          )}
        </div>

        {/* 관련 지원 정보 (유형을 골라야 보임) */}
        {related.state.phase !== "idle" && (
          <section className="flex flex-col gap-3">
            <h2 className="text-subhead font-bold text-text-primary">관련 지원 정보</h2>
            {related.state.phase === "loading" && (
              <div className="h-[132px] animate-pulse rounded-card bg-bg-subtle" role="status" aria-label="불러오는 중이에요" />
            )}
            {related.state.phase === "error" && (
              <div className="flex flex-col items-start gap-2 rounded-card bg-pink-soft px-[18px] py-4">
                <p className="text-body font-bold text-pink-strong">{getErrorMessage(related.state.error)}</p>
                <button type="button" onClick={related.retry} className="text-caption font-bold text-pink-strong underline">
                  다시 시도
                </button>
              </div>
            )}
            {related.state.phase === "done" &&
              (first ? (
                <div className="flex flex-col gap-2.5 rounded-card bg-sky-soft px-[18px] py-4">
                  <div className="flex">
                    <Chip tone="sky">용인시 공공데이터</Chip>
                  </div>
                  <p className="text-[18px] font-bold leading-[1.35] text-text-primary">{first.name}</p>
                  {first.kind === "PROGRAM" && (
                    <p className="text-[14px] leading-[1.5] text-text-secondary">{first.summary}</p>
                  )}
                  <Button variant="outline" onClick={() => router.push(`/support/${first.resourceId}`)}>
                    지원 정보 자세히 보기
                  </Button>
                </div>
              ) : (
                <p className="rounded-card bg-bg-subtle px-[18px] py-4 text-body text-text-secondary">
                  이 조건에 맞는 지원 정보가 아직 없어요.
                </p>
              ))}
          </section>
        )}

        <p className="flex items-start gap-1.5 text-caption font-medium leading-[1.45] text-text-tertiary">
          <InfoIcon size={16} className="shrink-0" />
          실제 이용 가능 여부와 정원은 제공기관에 확인이 필요해요
        </p>

        <Button onClick={handleSearch}>관련 지원 찾아보기</Button>
      </div>
    </main>
  );
}
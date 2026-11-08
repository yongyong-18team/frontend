"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Header, Button, Chip, EmptyState, ListRow, Select } from "@/components/common";
import { BuildingIcon, ChatIcon, InfoIcon, SearchIcon } from "@/components/icons/Icons";
import { DISTRICT_LABEL, type District } from "@/constants/labels";
import { mockSubject } from "@/mocks/subject";
import { mockSearchResources, type CareTerm, type ResourceKind, type ResourceResult } from "@/mocks/resource";

const DISTRICT_OPTIONS = (Object.keys(DISTRICT_LABEL) as District[]).map((d) => ({ value: d, label: DISTRICT_LABEL[d] }));

/** Figma 필터 칩 자리 → RES-02 kind (전체는 kind 생략) */
const FILTERS: { value: ResourceKind | null; label: string }[] = [
  { value: null, label: "전체" },
  { value: "FACILITY", label: "시설" },
  { value: "PROGRAM", label: "제도" },
];

/** 시설: Figma 1번 줄(건물·하늘) / 제도: Figma 3번 줄(말풍선·민트) */
const KIND_STYLE = {
  FACILITY: { label: "시설", tone: "sky", Icon: BuildingIcon },
  PROGRAM: { label: "제도", tone: "mint", Icon: ChatIcon },
} as const;

function subtitle(r: ResourceResult) {
  return r.kind === "PROGRAM" ? r.summary : `용인시 ${DISTRICT_LABEL[r.district]} · ${r.phone}`;
}

type Props = {
  careTerm: CareTerm | null;
  neededDate: string | null;
  initialDistrict: District | null;
};

export default function SupportResultsView({ careTerm, neededDate, initialDistrict }: Props) {
  const router = useRouter();
  // TODO(D4): 등록 지역은 SUBJ-02 district
  const registeredDistrict = mockSubject.district;

  const [district, setDistrict] = useState<District>(initialDistrict ?? registeredDistrict);
  const [kind, setKind] = useState<ResourceKind | null>(null);

  // 지역·필터가 바뀌면 다시 검색 (5.1 조건 careTerm·neededDate는 그대로 유지)
  // TODO(D4): RES-02 API로 교체 (GET /subjects/{subjectId}/resources/search?careTerm=&neededDate=&district=&kind=)
  const res = useMemo(
    () =>
      mockSearchResources(
        { careTerm: careTerm ?? undefined, neededDate: neededDate ?? undefined, district, kind: kind ?? undefined },
        registeredDistrict,
      ),
    [careTerm, neededDate, district, kind, registeredDistrict],
  );
  const count = res.results.length;

  return (
    <main className="flex flex-col pb-[120px]">
      <Header title="공공 돌봄 지원 찾기" subtitle="용인시의 지원 정보를 찾아볼 수 있어요" back />

      <div className="flex flex-col gap-6 px-6">
        {/* 지역 * */}
        <Select
          label="지역"
          required
          value={district}
          options={DISTRICT_OPTIONS}
          formatSelected={(o) => `용인시 ${o.label}`}
          onChange={(v) => setDistrict(v as District)}
        />

        {/* 관련 지원 정보 */}
        <section className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <h2 className="min-w-0 flex-1 text-subhead font-bold text-text-primary">관련 지원 정보</h2>
            <Chip tone={count > 0 ? "primary" : "pink"}>{count}건</Chip>
          </div>

          <div className="flex gap-2" role="group" aria-label="분류">
            {FILTERS.map((f) => {
              const selected = kind === f.value;
              return (
                <button
                  key={f.label}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setKind(f.value)}
                  className={`rounded-full px-4 py-2 text-[14px] font-bold leading-[1.4] tracking-[-0.21px] active:opacity-80 ${
                    selected
                      ? "bg-primary-strong text-text-on-primary"
                      : "border border-line-strong bg-bg-surface text-text-secondary"
                  }`}
                >
                  {f.label}
                </button>
              );
            })}
          </div>

          {count > 0 && (
            <div className="flex flex-col divide-y divide-line-base rounded-card bg-bg-surface px-4 py-1">
              {res.results.map((r) => {
                const k = KIND_STYLE[r.kind];
                return (
                  <ListRow
                    key={r.resourceId}
                    size="lg"
                    href={`/support/${r.resourceId}`}
                    icon={<k.Icon size={22} />}
                    iconTone={k.tone}
                    title={
                      <span className="flex items-center gap-1.5">
                        <span className="min-w-0 truncate">{r.name}</span>
                        <Chip tone={k.tone}>{k.label}</Chip>
                      </span>
                    }
                    description={subtitle(r)}
                  />
                );
              })}
            </div>
          )}
        </section>

        {/* 5.2 [예외] 검색 결과 없음 */}
        {count === 0 && (
          <div className="flex flex-col gap-6">
            <EmptyState
              icon={<SearchIcon size={44} />}
              title="일치하는 지원 정보가 없어요"
              description="지역이나 분류를 바꿔서 다시 찾아보세요."
            />
            <Button variant="outline" onClick={() => router.push("/support/find")}>
              조건 다시 설정
            </Button>
          </div>
        )}

        {/* 안내 + RES-02 disclaimer (항상 표시) */}
        <div className="flex flex-col gap-1.5">
          {count > 0 && (
            <p className="flex items-start gap-1.5 text-caption font-medium leading-[1.45] text-text-tertiary">
              <InfoIcon size={16} className="shrink-0" />
              용인시 복지시설 정보·경기데이터드림 기준이에요
            </p>
          )}
          <p className="flex items-start gap-1.5 text-caption font-medium leading-[1.45] text-text-tertiary">
            <InfoIcon size={16} className="shrink-0" />
            {res.disclaimer}
          </p>
        </div>
      </div>
    </main>
  );
}
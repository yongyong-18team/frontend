"use client";

import { useEffect, useId, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Header, Button, Chip, ListRow, Dialog, LoadingState, ErrorState } from "@/components/common";
import { CheckIcon, InfoIcon, PhoneIcon, PlusIcon, UserIcon, XIcon } from "@/components/icons/Icons";
import { SectionIcon, SECTION_TONE, TONE_CLASS } from "@/components/icons/SectionIcons";
import { DISTRICT_LABEL, SECTION_LABEL, type SectionCode } from "@/constants/labels";
import { useGuide } from "@/hooks/useGuide";
import { getErrorMessage } from "@/lib/api/client";
import type { GuideData, GuideSectionBlock } from "@/lib/api/guide";

/** 배치는 Figma 3.1: 긴급 카드 요약 4칸 + 항목별 상세 5줄 */
const SUMMARY_SECTIONS: SectionCode[] = ["PROHIBITED", "HEALTH_RISK", "COMMUNICATION", "BEHAVIOR_RESPONSE"];
const DETAIL_SECTIONS: SectionCode[] = ["DAILY_LIFE", "COMMUNICATION", "BEHAVIOR_RESPONSE", "MEDICATION", "PREFERENCE"];

/** "2026-11-03T21:10:00+09:00" → "11월 3일" */
function formatDate(iso: string) {
  return `${Number(iso.slice(5, 7))}월 ${Number(iso.slice(8, 10))}일`;
}

/** 섹션에서 가장 최근 갱신일. 항목이 없으면 설명서 갱신일, 그것도 없으면 null */
function latestDate(section: GuideSectionBlock, fallback: string | null) {
  const dates = section.entries.map((e) => e.updatedAt).sort();
  return dates.length > 0 ? dates[dates.length - 1] : fallback;
}

/** 3.2에서 저장하고 넘어올 때 남기는 표시 (한 번 보여 주고 지움) */
const GUIDE_SAVED_KEY = "guide-saved"; // 3.2 편집 화면과 같은 값

/** 저장 완료 안내: 3.2에서 저장 후 넘어왔을 때만 3초 보여 줌 */
function useSavedNotice() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    try {
      if (sessionStorage.getItem(GUIDE_SAVED_KEY)) {
        sessionStorage.removeItem(GUIDE_SAVED_KEY);
        setShow(true);
      }
    } catch {
      // 저장소를 못 쓰는 브라우저면 안내만 생략
    }
  }, []);
  useEffect(() => {
    if (!show) return;
    const t = setTimeout(() => setShow(false), 3000);
    return () => clearTimeout(t);
  }, [show]);
  return show;
}

/** 3.1 돌봄 설명서 (GUIDE-01) */
export default function GuidePage() {
  const { state, retry } = useGuide();

  if (state.phase === "loading") {
    return (
      <main className="flex flex-col pb-[120px]">
        <Header title="돌봄 설명서" />
        <LoadingState count={3} label="정보를 불러오고 있어요." />
      </main>
    );
  }
  if (state.phase === "error") {
    return (
      <main className="flex flex-col pb-[120px]">
        <Header title="돌봄 설명서" />
        <ErrorState title="설명서를 불러오지 못했어요." description={getErrorMessage(state.error)} onRetry={retry} />
      </main>
    );
  }
  return <GuideView guide={state.data} />;
}

function GuideView({ guide }: { guide: GuideData }) {
  const router = useRouter();
  const dialogTitleId = useId();
  const { basicInfo, sections, editable, updatedAt } = guide;

  // 열린 항목은 코드만 기억하고 내용은 항상 최신 데이터에서 꺼냄 (저장 후 돌아왔을 때 옛 내용이 보이지 않게)
  const [openCode, setOpenCode] = useState<SectionCode | null>(null);
  const findSection = (code: SectionCode): GuideSectionBlock =>
    sections.find((s) => s.section === code) ?? { section: code, entries: [] };
  const openSection = openCode ? findSection(openCode) : null;
  const setOpenSection = (s: GuideSectionBlock | null) => setOpenCode(s ? s.section : null);

  // 다른 화면으로 가면 상세 팝업을 닫음 (Next가 이 화면을 숨겨 두었다가 다시 보여 줄 때 팝업이 남아 있지 않게)
  useEffect(() => () => setOpenCode(null), []);
  const openDate = openSection ? latestDate(openSection, updatedAt) : null;
  const saved = useSavedNotice();

  return (
    <main className="flex flex-col pb-[120px]">
      <Header
        title={`${basicInfo.name} 돌봄 설명서`}
        subtitle="승인된 정보가 차곡차곡 쌓여요"
        right={
          <div className="flex flex-col items-end gap-1.5">
            {updatedAt && <Chip tone="mint">{formatDate(updatedAt)} 갱신</Chip>}
            <Link href="/share/history" className="py-1 text-caption font-bold text-primary-strong">
              공유 내역 ›
            </Link>
          </div>
        }
      />

      <div className="flex flex-col gap-7 px-6">
        {saved && (
          <p
            role="status"
            className="flex items-center gap-2 rounded-input bg-mint-soft px-4 py-3 text-caption font-bold text-mint-strong"
          >
            <CheckIcon size={16} className="shrink-0" />
            돌봄 설명서가 수정됐어요.
          </p>
        )}

        {/* 긴급 카드 */}
        <section className="flex flex-col gap-3.5 rounded-card border-[1.5px] border-primary-base bg-bg-surface px-[18px] py-4">
          <div className="flex items-center gap-3.5">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-peach-soft text-peach-strong">
              <UserIcon size={28} />
            </span>
            <div className="flex min-w-0 flex-1 flex-col items-start gap-[3px]">
              <Chip tone="pink">긴급 카드</Chip>
              <span className="text-[18px] font-bold leading-[1.35] text-text-primary">
                {basicInfo.name} · {basicInfo.age}세
              </span>
              <span className="text-caption text-text-secondary">
                용인시 {DISTRICT_LABEL[basicInfo.district]}
                {basicInfo.dong ? ` ${basicInfo.dong}` : ""}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-[12px] bg-pink-soft px-3.5 py-2.5 text-pink-strong">
            <PhoneIcon size={16} className="shrink-0" />
            <span className="min-w-0 flex-1 whitespace-pre-wrap text-[14px] font-bold leading-[1.45]">
              {basicInfo.emergencyContact ? `비상 연락처  ${basicInfo.emergencyContact}` : "등록된 비상 연락처가 없어요"}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {SUMMARY_SECTIONS.map((code) => {
              const section = findSection(code);
              return (
                <button
                  key={code}
                  type="button"
                  onClick={() => setOpenSection(section)}
                  className="flex flex-col gap-1.5 rounded-input bg-peach-soft p-3 text-left active:opacity-80"
                >
                  <span className="flex w-full items-start gap-1.5 text-peach-strong">
                    <SectionIcon section={code} size={16} className="shrink-0" />
                    <span className="min-w-0 flex-1 text-caption font-bold leading-[1.35]">{SECTION_LABEL[code]}</span>
                  </span>
                  {section.entries.length > 0 ? (
                    section.entries.slice(0, 2).map((e) => (
                      <span key={e.entryId} className="text-caption font-medium leading-[1.4] text-text-primary">
                        · {e.content}
                      </span>
                    ))
                  ) : (
                    <span className="text-caption font-medium leading-[1.4] text-text-tertiary">아직 등록된 정보가 없어요.</span>
                  )}
                </button>
              );
            })}
          </div>
        </section>

        {/* 항목별 상세 */}
        <section className="flex flex-col gap-3">
          <div className="flex flex-col gap-0.5">
            <h2 className="text-subhead font-bold text-text-primary">항목별 상세</h2>
            <p className="text-caption text-text-tertiary">눌러서 자세한 내용을 볼 수 있어요.</p>
          </div>
          <div className="flex flex-col divide-y divide-line-base rounded-card bg-bg-surface px-4 py-1">
            {DETAIL_SECTIONS.map((code) => {
              const section = findSection(code);
              return (
                <ListRow
                  key={code}
                  title={SECTION_LABEL[code]}
                  description={section.entries[0]?.content ?? "아직 등록된 정보가 없어요."}
                  icon={<SectionIcon section={code} size={20} />}
                  iconTone={SECTION_TONE[code]}
                  trailing={
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-bg-subtle text-primary-strong">
                      <PlusIcon size={16} />
                    </span>
                  }
                  onClick={() => setOpenSection(section)}
                />
              );
            })}
          </div>
        </section>

        {/* 하단 버튼 */}
        <section className="flex gap-2">
          {editable && (
            <Button variant="outline" onClick={() => router.push("/guide/edit")}>
              편집하기
            </Button>
          )}
          <Button onClick={() => router.push("/share?documentType=GUIDE")}>설명서 공유</Button>
        </section>
      </div>

      {/* 3.1 [상태] 항목 상세 팝업 */}
      <Dialog open={!!openSection} onClose={() => setOpenSection(null)} labelledBy={dialogTitleId}>
        {openSection && (
          <div className="flex flex-col gap-3.5">
            <div className="flex items-center gap-2.5">
              <span
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px] ${TONE_CLASS[SECTION_TONE[openSection.section]]}`}
              >
                <SectionIcon section={openSection.section} size={18} />
              </span>
              <h2 id={dialogTitleId} className="min-w-0 flex-1 text-[18px] font-bold leading-[1.35] text-text-primary">
                {SECTION_LABEL[openSection.section]}
              </h2>
              <button
                type="button"
                onClick={() => setOpenSection(null)}
                aria-label="닫기"
                className="-mr-2.5 flex h-11 w-11 items-center justify-center text-text-secondary"
              >
                <XIcon size={22} />
              </button>
            </div>

            <div className="h-px w-full bg-line-base" />

            {openSection.entries.length > 0 ? (
              <ul className="flex flex-col gap-3">
                {openSection.entries.map((e) => (
                  <li key={e.entryId} className="text-body font-medium leading-[1.5] text-text-primary">
                    {e.content}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-body font-medium text-text-tertiary">아직 등록된 정보가 없어요.</p>
            )}

            <p className="flex items-center gap-1.5 text-micro font-medium leading-[1.45] text-text-tertiary">
              <InfoIcon size={14} className="shrink-0" />
              {openDate ? `${formatDate(openDate)} 갱신 · ` : ""}승인된 기록 {openSection.entries.length}건 반영
            </p>

            {editable && (
              <Button variant="soft" onClick={() => {
                  const code = openSection.section;
                  setOpenCode(null);
                  router.push(`/guide/edit?section=${code}`);
                }}>
                이 항목 편집하기
              </Button>
            )}
          </div>
        )}
      </Dialog>
    </main>
  );
}
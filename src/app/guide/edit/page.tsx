"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Header, Button, Input, Select, EmptyState } from "@/components/common";
import { PlusIcon, XIcon } from "@/components/icons/Icons";
import {
  DISTRICT_LABEL,
  SECTION_LABEL,
  SECTION_ORDER,
  type District,
  type SectionCode,
} from "@/constants/labels";
import { mockGuide } from "@/mocks/guide";
import { mockSubject } from "@/mocks/subject";

/** 화면에서 고치는 중인 항목 */
type DraftEntry = {
  key: string;
  entryId: number | null; // null이면 새로 추가한 항목
  section: SectionCode;
  content: string;
  original: string;
  deleted: boolean;
};

const THIS_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: THIS_YEAR - 1930 + 1 }, (_, i) => {
  const y = String(THIS_YEAR - i);
  return { value: y, label: `${y}년` };
});
const DISTRICT_OPTIONS = (Object.keys(DISTRICT_LABEL) as District[]).map((d) => ({
  value: d,
  label: DISTRICT_LABEL[d],
}));
const SECTION_OPTIONS = SECTION_ORDER.map((s) => ({ value: s, label: SECTION_LABEL[s] }));

const MAX_ENTRY = 500; // GUIDE-02·03 content 1~500자

function initialDrafts(): DraftEntry[] {
  return mockGuide.sections.flatMap((s) =>
    s.entries.map((e) => ({
      key: `e${e.entryId}`,
      entryId: e.entryId,
      section: s.section,
      content: e.content,
      original: e.content,
      deleted: false,
    })),
  );
}

export default function GuideEditPage() {
  const router = useRouter();
  // TODO(D4): SUBJ-02, GUIDE-01 API로 교체
  const subject = mockSubject;
  const editable = mockGuide.editable;

  // 기본 정보 (SUBJ-03)
  const [name, setName] = useState(subject.name);
  const [birthYear, setBirthYear] = useState(String(subject.birthYear));
  const [district, setDistrict] = useState<District>(subject.district);
  const [dong, setDong] = useState(subject.dong ?? "");
  const [emergencyContact, setEmergencyContact] = useState(subject.emergencyContact ?? "");

  // 항목 (GUIDE-02·03·04)
  const [section, setSection] = useState<SectionCode>("PROHIBITED");
  const [drafts, setDrafts] = useState<DraftEntry[]>(initialDrafts);
  const newKey = useRef(0);

  const [errors, setErrors] = useState<{ name?: string; entries?: string }>({});
  const [saving, setSaving] = useState(false);

  const visible = drafts.filter((d) => d.section === section && !d.deleted);

  const updateDraft = (key: string, content: string) =>
    setDrafts((prev) => prev.map((d) => (d.key === key ? { ...d, content } : d)));

  const removeDraft = (key: string) =>
    setDrafts((prev) =>
      prev.flatMap((d) => {
        if (d.key !== key) return [d];
        return d.entryId === null ? [] : [{ ...d, deleted: true }]; // 새 항목은 그냥 빼고, 기존 항목은 삭제 표시
      }),
    );

  const addDraft = () => {
    newKey.current += 1;
    setDrafts((prev) => [
      ...prev,
      { key: `n${newKey.current}`, entryId: null, section, content: "", original: "", deleted: false },
    ]);
  };

  const handleSave = async () => {
    // 1. 입력 확인
    const nextErrors: { name?: string; entries?: string } = {};
    const trimmedName = name.trim();
    if (trimmedName.length < 2 || trimmedName.length > 20) {
      nextErrors.name = "이름은 2~20자로 입력해 주세요.";
    }
    if (drafts.some((d) => !d.deleted && d.entryId !== null && d.content.trim() === "")) {
      nextErrors.entries = "비어 있는 항목이 있어요. 내용을 입력하거나 삭제해 주세요.";
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    // 2. SUBJ-03: 바뀐 값만
    const subjectPatch: Record<string, string | number | null> = {};
    if (trimmedName !== subject.name) subjectPatch.name = trimmedName;
    if (Number(birthYear) !== subject.birthYear) subjectPatch.birthYear = Number(birthYear);
    if (district !== subject.district) subjectPatch.district = district;
    if (dong.trim() !== (subject.dong ?? "")) subjectPatch.dong = dong.trim() || null;
    if (emergencyContact.trim() !== (subject.emergencyContact ?? ""))
      subjectPatch.emergencyContact = emergencyContact.trim() || null;

    // 3. GUIDE-02 / 03 / 04
    const added = drafts
      .filter((d) => d.entryId === null && !d.deleted && d.content.trim() !== "")
      .map((d) => ({ section: d.section, content: d.content.trim() }));
    const edited = drafts
      .filter((d) => d.entryId !== null && !d.deleted && d.content.trim() !== d.original)
      .map((d) => ({ entryId: d.entryId, content: d.content.trim() }));
    const deleted = drafts.filter((d) => d.entryId !== null && d.deleted).map((d) => d.entryId);

    setSaving(true);
    // TODO(D4): 실제 API 호출. 실패하면 error.message를 보여주고 입력은 그대로 둔다.
    console.log("SUBJ-03 PATCH", Object.keys(subjectPatch).length ? subjectPatch : "(변경 없음)");
    console.log("GUIDE-02 추가", added);
    console.log("GUIDE-03 수정", edited);
    console.log("GUIDE-04 삭제", deleted);
    setSaving(false);
    router.push("/guide");
  };

  // 공동 관리자는 편집 불가 (서버도 403으로 막음)
  if (!editable) {
    return (
      <main className="flex flex-col pb-[120px]">
        <Header title="돌봄 설명서 편집" back />
        <EmptyState title="설명서는 주 보호자만 수정할 수 있어요" description="내용은 돌봄 설명서에서 확인할 수 있어요." />
      </main>
    );
  }

  return (
    <main className="flex flex-col pb-[120px]">
      <Header title="돌봄 설명서 편집" subtitle="저장하면 설명서에 바로 반영돼요" back />

      <div className="flex flex-col gap-6 px-6">
        {/* 대상자 정보 */}
        <section className="flex flex-col gap-4 rounded-card bg-bg-surface px-[18px] py-4">
          <span className="text-caption font-bold leading-[1.45] text-primary-strong">대상자 정보</span>

          <Input
            label="이름"
            required
            value={name}
            maxLength={20}
            error={errors.name}
            onChange={(e) => setName(e.target.value)}
          />

          <Select label="태어난 연도" required value={birthYear} options={YEAR_OPTIONS} onChange={setBirthYear} />

          <div className="flex flex-col gap-2">
            <span className="text-body font-bold text-text-primary">지역 *</span>
            <div className="flex gap-2">
              <Select
                aria-label="구"
                value={district}
                options={DISTRICT_OPTIONS}
                formatSelected={(o) => `용인시 ${o.label}`}
                onChange={(v) => setDistrict(v as District)}
                className="min-w-0 flex-1"
              />
              <div className="w-[136px] shrink-0">
                <Input
                  aria-label="상세 지역"
                  placeholder="상세 지역"
                  value={dong}
                  maxLength={20}
                  onChange={(e) => setDong(e.target.value)}
                />
              </div>
            </div>
          </div>

          <Input
            label="비상 연락처"
            placeholder="예) 어머니 010-0000-0000"
            value={emergencyContact}
            onChange={(e) => setEmergencyContact(e.target.value)}
          />
        </section>

        {/* 정보 분류 */}
        <Select
          label="정보 분류"
          value={section}
          options={SECTION_OPTIONS}
          onChange={(v) => setSection(v as SectionCode)}
        />

        {/* 상세 내용: Figma 입력 상자 모양, 항목 하나당 상자 하나 */}
        <section className="flex flex-col gap-2">
          <span className="text-body font-bold text-text-primary">상세 내용</span>

          {visible.length === 0 && (
            <p className="rounded-[16px] bg-bg-subtle px-4 py-3.5 text-body leading-[1.6] text-text-tertiary">
              아직 작성된 내용이 없어요
            </p>
          )}

          {visible.map((d, i) => (
            <div
              key={d.key}
              className="flex flex-col gap-2 rounded-[16px] border border-line-strong bg-bg-surface px-4 pb-3 pt-3.5 focus-within:border-2 focus-within:border-primary-strong"
            >
              <div className="flex items-start gap-2">
                <textarea
                  value={d.content}
                  maxLength={MAX_ENTRY}
                  rows={2}
                  aria-label={`${SECTION_LABEL[section]} ${i + 1}번째 항목`}
                  placeholder="내용을 입력해 주세요"
                  onChange={(e) => updateDraft(d.key, e.target.value)}
                  className="min-w-0 flex-1 resize-none bg-transparent text-body leading-[1.6] text-text-primary outline-none placeholder:text-text-tertiary"
                />
                <button
                  type="button"
                  onClick={() => removeDraft(d.key)}
                  aria-label="항목 삭제"
                  className="-mr-2 -mt-2 flex h-10 w-10 shrink-0 items-center justify-center text-text-tertiary"
                >
                  <XIcon size={18} />
                </button>
              </div>
              <span className="text-right text-micro leading-[1.45] text-text-tertiary">
                {d.content.length} / {MAX_ENTRY}
              </span>
            </div>
          ))}

          <button
            type="button"
            onClick={addDraft}
            className="flex h-14 items-center justify-center gap-1.5 rounded-[16px] border-[1.5px] border-dashed border-line-strong text-body font-bold text-primary-strong active:opacity-70"
          >
            <PlusIcon size={16} />
            항목 추가
          </button>

          {errors.entries && <p className="text-caption text-pink-strong">{errors.entries}</p>}
        </section>

        <Button onClick={handleSave} disabled={saving}>
          {saving ? "저장 중..." : "수정 내용 저장"}
        </Button>
      </div>
    </main>
  );
}
// src/lib/api/guide.ts
// 설명서·대상자 API (API 명세 2-2 SUBJ-02·03, 2-6 GUIDE-01~04, 백엔드 A·B)
//
// NEXT_PUBLIC_REAL_API에 guide(또는 all)가 있으면 실제 서버, 없으면 가짜 DB(src/mocks 복사본)로 동작합니다.
// 가짜 DB는 새로고침하면 처음으로 돌아갑니다.

import { ApiError, api, subjectPath } from '@/lib/api/client';
import * as mock from '@/lib/api/mock/store';
import type { District, SectionCode } from '@/constants/labels';
import { mockGuide } from '@/mocks/guide';
import { mockSubject } from '@/mocks/subject';
import { isReal } from '@/lib/api/realApi';

/* ───────────── 타입 (명세 그대로) ───────────── */

export type GuideSourceType = 'ONBOARDING' | 'DIARY' | 'MANUAL';

export type GuideEntry = {
  entryId: number;
  content: string;
  sourceType: GuideSourceType;
  updatedAt: string;
};

/** 섹션 하나 (7개 섹션은 항목이 없어도 항상 내려옴) */
export type GuideSectionBlock = { section: SectionCode; entries: GuideEntry[] };

/** GUIDE-01 응답 */
export type GuideData = {
  basicInfo: {
    name: string;
    age: number;
    district: District;
    dong: string | null;
    emergencyContact: string | null;
  };
  /** 항목이 하나도 없으면 null (백엔드 #55) */
  updatedAt: string | null;
  sections: GuideSectionBlock[];
  /** OWNER true, CO false */
  editable: boolean;
};

/** SUBJ-02 응답 */
export type SubjectData = {
  subjectId: number;
  name: string;
  birthYear: number;
  age: number;
  district: District;
  dong: string | null;
  emergencyContact: string | null;
};

/** SUBJ-03 요청 (바꿀 값만) */
export type SubjectPatch = Partial<{
  name: string;
  birthYear: number;
  district: District;
  dong: string | null;
  emergencyContact: string | null;
}>;

/* ───────────── 가짜 DB (백엔드 연결 시 삭제) ───────────── */

let guideDb: GuideData = structuredClone(mockGuide) as GuideData;
let subjectDb: SubjectData = structuredClone(mockSubject) as SubjectData;
let nextEntryId = 1000;
const nowIso = () => new Date().toISOString();

function findEntry(entryId: number) {
  for (const s of guideDb.sections) {
    const e = s.entries.find((x) => x.entryId === entryId);
    if (e) return { section: s, entry: e };
  }
  throw new ApiError(404, 'GUIDE_ITEM_NOT_FOUND', '항목을 찾을 수 없어요.');
}

function checkContent(content: string) {
  const c = content.trim();
  if (c.length < 1 || c.length > 500) throw new ApiError(400, 'COMMON_VALIDATION', '입력한 내용을 다시 확인해 주세요.');
  return c;
}

/* ───────────── API ───────────── */

/** GUIDE-01 설명서 전체 (기본 정보 + 7개 섹션) */
export async function getGuide(): Promise<GuideData> {
  if (isReal('guide')) return api.get<GuideData>(subjectPath('/guide'));

  // ── 가짜 응답 ──
  await mock.delay(500);
  return structuredClone(guideDb);
}

/** GUIDE-02 항목 추가 (MANUAL) */
export async function addGuideEntry(section: SectionCode, content: string): Promise<{ entryId: number }> {
  if (isReal('guide')) return api.post<{ entryId: number }>(subjectPath('/guide/entries'), { section, content });

  // ── 가짜 응답 ──
  await mock.delay(300);
  const c = checkContent(content);
  const block = guideDb.sections.find((s) => s.section === section);
  if (!block) throw new ApiError(400, 'COMMON_VALIDATION', '입력한 내용을 다시 확인해 주세요.');
  const dup = block.entries.find((e) => e.content.replace(/\s/g, '') === c.replace(/\s/g, ''));
  if (dup) return { entryId: dup.entryId }; // 같은 내용이면 기존 항목 (백엔드 #55)
  const entry: GuideEntry = { entryId: nextEntryId++, content: c, sourceType: 'MANUAL', updatedAt: nowIso() };
  block.entries.push(entry);
  guideDb.updatedAt = entry.updatedAt;
  return { entryId: entry.entryId };
}

/** GUIDE-03 항목 수정 */
export async function updateGuideEntry(entryId: number, content: string): Promise<{ entryId: number; updatedAt: string }> {
  if (isReal('guide')) {
    return api.patch<{ entryId: number; updatedAt: string }>(subjectPath(`/guide/entries/${entryId}`), { content });
  }

  // ── 가짜 응답 ──
  await mock.delay(300);
  const { entry } = findEntry(entryId);
  entry.content = checkContent(content);
  entry.updatedAt = nowIso();
  guideDb.updatedAt = entry.updatedAt;
  return { entryId, updatedAt: entry.updatedAt };
}

/** GUIDE-04 항목 삭제 */
export async function deleteGuideEntry(entryId: number): Promise<void> {
  if (isReal('guide')) {
    await api.delete<void>(subjectPath(`/guide/entries/${entryId}`));
    return;
  }

  // ── 가짜 응답 ──
  await mock.delay(300);
  const { section } = findEntry(entryId);
  section.entries = section.entries.filter((e) => e.entryId !== entryId);
  const left = guideDb.sections.flatMap((s) => s.entries);
  guideDb.updatedAt = left.length > 0 ? nowIso() : null;
}

/** SUBJ-02 대상자 기본 정보 */
export async function getSubject(): Promise<SubjectData> {
  if (isReal('guide')) return api.get<SubjectData>(subjectPath());

  // ── 가짜 응답 ──
  await mock.delay(400);
  return structuredClone(subjectDb);
}

/**
 * SUBJ-03 대상자 기본 정보·비상 연락처 수정 (바꿀 값만)
 * TODO(현석님 확인): 동·비상 연락처를 지울 때 null / "" 중 무엇을 받는지. 지금은 null로 보냄
 */
export async function updateSubject(patch: SubjectPatch): Promise<{ subjectId: number; updatedAt: string }> {
  if (isReal('guide')) return api.patch<{ subjectId: number; updatedAt: string }>(subjectPath(), patch);

  // ── 가짜 응답 ──
  await mock.delay(300);
  if (patch.name !== undefined && (patch.name.length < 2 || patch.name.length > 20)) {
    throw new ApiError(400, 'SUBJECT_INVALID_NAME', '이름은 2~20자로 입력해 주세요.');
  }
  subjectDb = { ...subjectDb, ...patch };
  if (patch.birthYear !== undefined) subjectDb.age = new Date().getFullYear() - patch.birthYear;
  guideDb = {
    ...guideDb,
    basicInfo: {
      name: subjectDb.name,
      age: subjectDb.age,
      district: subjectDb.district,
      dong: subjectDb.dong,
      emergencyContact: subjectDb.emergencyContact,
    },
  };
  return { subjectId: subjectDb.subjectId, updatedAt: nowIso() };
}
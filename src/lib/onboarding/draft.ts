// src/lib/onboarding/draft.ts
// 0.2-1~0.2-4 입력값 임시 보관함
//   - 명세: 중간 저장 API가 없고 0.2-4에서 ONB-01 한 번으로 보냄 → 그때까지 브라우저가 들고 있음
//   - sessionStorage에 저장해서 새로고침해도 남고, 탭을 닫으면 사라짐
//   - 화면에서는 useOnboardingDraft() 로 읽고 updateDraft() 로 고칩니다.

'use client';

import { useSyncExternalStore } from 'react';

import type { Relation } from '@/lib/api/auth';
import type { District, QuestionKey } from '@/lib/api/onboarding';

export type OnboardingDraft = {
  /** 보호자 태어난 연도는 받지 않음 (기획 문구 확정안 v1.4 [개발 확정]) */
  guardian: {
    displayName: string;
    relation: Relation | null;
  };
  subject: {
    name: string;
    birthYear: number | null;
    district: District | null;
    dong: string | null;
  };
  profile: Record<QuestionKey, string>;
};

const STORAGE_KEY = 'yongyong.onboardingDraft';
const EVENT = 'yongyong:onboarding-draft';

export const EMPTY_DRAFT: OnboardingDraft = {
  guardian: { displayName: '', relation: null },
  subject: { name: '', birthYear: null, district: null, dong: null },
  profile: { Q1: '', Q2: '', Q3: '', Q4: '', Q5: '' },
};

// useSyncExternalStore는 같은 값이면 같은 객체를 돌려줘야 해서 읽은 결과를 기억해 둠
let cachedRaw: string | null | undefined;
let cachedDraft: OnboardingDraft = EMPTY_DRAFT;

function readDraft(): OnboardingDraft {
  if (typeof window === 'undefined') return EMPTY_DRAFT;
  let raw: string | null = null;
  try {
    raw = window.sessionStorage.getItem(STORAGE_KEY);
  } catch {
    raw = null;
  }
  if (raw === cachedRaw) return cachedDraft;
  cachedRaw = raw;
  try {
    const saved = raw ? (JSON.parse(raw) as Partial<OnboardingDraft>) : {};
    cachedDraft = {
      guardian: {
        displayName: saved.guardian?.displayName ?? '',
        relation: saved.guardian?.relation ?? null,
      },
      subject: { ...EMPTY_DRAFT.subject, ...saved.subject },
      profile: { ...EMPTY_DRAFT.profile, ...saved.profile },
    };
  } catch {
    cachedDraft = EMPTY_DRAFT;
  }
  return cachedDraft;
}

function writeDraft(draft: OnboardingDraft | null) {
  try {
    if (draft) window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
    else window.sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // 저장이 막힌 브라우저: 이번 화면에서만 기억
    cachedRaw = draft ? JSON.stringify(draft) : null;
    cachedDraft = draft ?? EMPTY_DRAFT;
  }
  window.dispatchEvent(new Event(EVENT));
}

function subscribe(callback: () => void) {
  window.addEventListener(EVENT, callback);
  return () => window.removeEventListener(EVENT, callback);
}

/** 현재 입력값. 서버 렌더 중에는 빈 값 */
export function useOnboardingDraft() {
  return useSyncExternalStore(subscribe, readDraft, () => EMPTY_DRAFT);
}

/** 일부만 바꾸기 — 예: updateDraft((d) => ({ ...d, guardian: { ...d.guardian, displayName } })) */
export function updateDraft(change: (draft: OnboardingDraft) => OnboardingDraft) {
  writeDraft(change(readDraft()));
}

/** 등록이 끝나면 지움 */
export function clearDraft() {
  writeDraft(null);
}

/* ───────────── 단계별 완료 여부 (앞 단계를 건너뛰고 들어오면 돌려보낼 때 사용) ───────────── */

export const isGuardianDone = (d: OnboardingDraft) =>
  d.guardian.displayName.trim().length > 0 && d.guardian.relation !== null;

export const isSubjectDone = (d: OnboardingDraft) =>
  d.subject.name.trim().length >= 2 && d.subject.birthYear !== null && d.subject.district !== null;

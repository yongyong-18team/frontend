// src/lib/api/onboarding.ts
// 온보딩 API (API 명세 2-2 백엔드 B, TERMS-01은 백엔드 A)
//   - 0.2-1~0.2-3 입력은 화면이 들고 있다가 0.2-4 "등록 완료"에서 ONB-01 한 번으로 보냅니다 (중간 저장 API 없음)
// NEXT_PUBLIC_REAL_API에 terms·onboarding이 있으면 실제 서버, 없으면 가짜 서버(mock/auth.ts) (realApi.ts 참고)

import { api } from '@/lib/api/client';
import type { Relation } from '@/lib/api/auth';
import * as mock from '@/lib/api/mock/auth';
import { isReal } from '@/lib/api/realApi';

/* ───────────── 선택지 ───────────── */

export type District = 'CHEOIN' | 'GIHEUNG' | 'SUJI';

/** Figma 0.2-2 지역 목록 순서 그대로 */
export const DISTRICTS: { value: District; label: string }[] = [
  { value: 'CHEOIN', label: '용인시 처인구' },
  { value: 'GIHEUNG', label: '용인시 기흥구' },
  { value: 'SUJI', label: '용인시 수지구' },
];

/**
 * 상세 지역 — 기획 문구 확정안 v1.4 '지역 드롭다운' 목록 (행정동)
 * 선택 안 해도 됨 (명세 RES-02에서 dong은 null 가능)
 * TODO(백엔드 B·C): 명세 예시는 "풍덕천동"(법정동)이라 서버가 받는 이름과 맞는지 확인
 */
export const DONGS: Record<District, string[]> = {
  CHEOIN: ['포곡읍', '모현읍', '이동읍', '남사읍', '양지읍', '원삼면', '백암면', '중앙동', '역북동', '삼가동', '유림1동', '유림2동', '동부동'],
  GIHEUNG: ['신갈동', '영덕1동', '영덕2동', '구갈동', '상갈동', '보라동', '기흥동', '서농동', '구성동', '마북동', '동백1동', '동백2동', '동백3동', '상하동', '보정동'],
  SUJI: ['풍덕천1동', '풍덕천2동', '신봉동', '죽전1동', '죽전2동', '죽전3동', '동천동', '상현1동', '상현2동', '상현3동', '성복동'],
};

export const RELATIONS: { value: Relation; label: string }[] = [
  { value: 'PARENT', label: '부모' },
  { value: 'OTHER', label: '기타 보호자' },
];

export type QuestionKey = 'Q1' | 'Q2' | 'Q3' | 'Q4' | 'Q5';

/**
 * 0.2-3 질문. 답 하나가 설명서 항목 하나가 됩니다 (명세 2-2)
 * 문구는 기획 문구 확정안 v1.4. Q5는 Figma 0.2-3에는 없지만 명세·확정안에 있어서 맨 아래에 둠
 */
export const QUESTIONS: { key: QuestionKey; title: string; placeholder: string }[] = [
  { key: 'Q1', title: '하루 일과 및 생활 습관', placeholder: '예) 아침 7시 기상, 오후엔 산책을 좋아해요' },
  { key: 'Q2', title: '식사 및 복약 시 주의사항', placeholder: '예) 견과류 알레르기, 저녁 약은 식후 30분' },
  { key: 'Q3', title: '도전 행동 및 발생 상황', placeholder: '예) 큰 소리가 나면 귀를 막고 소리를 질러요' },
  { key: 'Q4', title: '효과적이었던 대처 방법', placeholder: '예) 좋아하는 음악을 틀어주면 진정돼요' },
  { key: 'Q5', title: '의사소통 방식', placeholder: '예) 짧은 문장이나 그림카드로 의사를 표현해요' },
];

/* ───────────── 형식 검사 (명세 오류 문구와 같은 기준) ───────────── */

export const NAME_RULE_MESSAGE = '이름은 2~20자로 입력해 주세요.';
export const isValidName = (name: string) => {
  const length = name.trim().length;
  return length >= 2 && length <= 20;
};

export const MIN_BIRTH_YEAR = 1930;

/** 올해부터 1930년까지 (최근 연도가 위) */
export function birthYearOptions() {
  const thisYear = new Date().getFullYear();
  return Array.from({ length: thisYear - MIN_BIRTH_YEAR + 1 }, (_, i) => thisYear - i);
}

/** 명세 SUBJ-02의 age와 같은 계산 (올해 - 태어난 해) */
export const ageFromBirthYear = (birthYear: number) => new Date().getFullYear() - birthYear;

/* ───────────── TERMS-01 동의 항목 ───────────── */

export type ConsentType = 'PRIVACY' | 'SENSITIVE_INFO' | 'AI_PROCESSING' | 'SUBJECT_AUTHORITY';

export type Term = {
  consentType: ConsentType;
  termsVersion: string;
  required: boolean;
  title: string;
  content: string;
};

/** TERMS-01 (공개 API) */
export async function getTerms(): Promise<Term[]> {
  if (isReal('terms')) {
    const res = await api.get<{ terms: Term[] }>('/terms', { auth: false });
    return res.terms;
  }

  // ── 가짜 응답 ──
  await mock.delay(300);
  return mock.TERMS;
}

/**
 * Figma 0.2-4의 체크박스 2개 → 동의 항목 4개
 *   - "민감정보 처리·AI 분석": SENSITIVE_INFO + AI_PROCESSING (명세에서 묶어도 된다고 함)
 *   - "개인정보 수집·이용": PRIVACY + SUBJECT_AUTHORITY (기획 확정안의 약관 초안도 이 둘을 한 체크박스에 둠)
 */
export const CONSENT_GROUPS = [
  { id: 'privacy', label: '개인정보 수집·이용 동의', types: ['PRIVACY', 'SUBJECT_AUTHORITY'] as ConsentType[] },
  { id: 'sensitive', label: '민감정보 처리·AI 분석 동의', types: ['SENSITIVE_INFO', 'AI_PROCESSING'] as ConsentType[] },
] as const;

/* ───────────── ONB-01 온보딩 일괄 등록 ───────────── */

export type OnboardingRequest = {
  guardian: { displayName: string; relation: Relation };
  subject: { name: string; birthYear: number; district: District; dong: string | null };
  profile: Record<QuestionKey, string | null>;
  consents: { consentType: ConsentType; termsVersion: string }[];
};

export type OnboardingResponse = { subjectId: number; createdGuideEntryCount: number };

/**
 * ONB-01
 * 실패: SUBJECT_INVALID_NAME 400, SUBJECT_INVALID_BIRTH_YEAR 400, SUBJECT_CONSENT_REQUIRED 400, ONB_ALREADY_COMPLETED 409
 */
export async function submitOnboarding(body: OnboardingRequest): Promise<OnboardingResponse> {
  if (isReal('onboarding')) return api.post<OnboardingResponse>('/onboarding', body);

  // ── 가짜 응답 ──
  await mock.delay(900);
  return mock.onboard(body);
}

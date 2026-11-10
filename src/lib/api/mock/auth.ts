// src/lib/api/mock/auth.ts
// 가짜 계정 저장소 (AUTH-01·02·03 흉내). localStorage에 저장, 이 브라우저에만 남습니다.
// 백엔드를 연결하면 mock 폴더째 지웁니다.
//
// 개발용 계정: demo1234 / demo1234 (대상자 "민준" 있음)
// 온보딩(ONB-01)·동의 항목(TERMS-01)도 여기서 흉내 냅니다.

import { ApiError } from '@/lib/api/client';
import type { Credentials, LoginResponse } from '@/lib/api/auth';
import type { OnboardingRequest, OnboardingResponse, Term } from '@/lib/api/onboarding';
import { getAccessToken, getSubjectId, type SubjectSummary } from '@/lib/auth/session';

export const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

type MockUser = {
  userId: number;
  loginId: string;
  password: string;
  displayName: string | null;
  relation: 'PARENT' | 'OTHER' | null;
  subjects: SubjectSummary[];
  pendingInvitationCount: number;
};

const STORAGE_KEY = 'yongyong-mock-auth-v1';
const MAX_FAILURES = 5;

const DEMO_USER: MockUser = {
  userId: 1,
  loginId: 'demo1234',
  password: 'demo1234',
  displayName: '김영희',
  relation: 'PARENT',
  subjects: [{ subjectId: 10, name: '민준', role: 'OWNER' }],
  pendingInvitationCount: 0,
};

let cache: MockUser[] | null = null;
const failures = new Map<string, number>();

function users(): MockUser[] {
  if (cache) return cache;
  let saved: MockUser[] = [];
  if (typeof window !== 'undefined') {
    try {
      saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '[]') as MockUser[];
    } catch {
      saved = [];
    }
  }
  cache = saved.some((u) => u.loginId === DEMO_USER.loginId) ? saved : [DEMO_USER, ...saved];
  return cache;
}

function save() {
  if (typeof window === 'undefined' || !cache) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
  } catch {
    /* 저장이 막혀 있으면 이번 방문 동안만 유지 */
  }
}

function validate({ loginId, password }: Credentials) {
  if (!/^[a-z0-9]{4,20}$/.test(loginId)) {
    throw new ApiError(400, 'AUTH_INVALID_LOGIN_ID_FORMAT', '아이디는 영문 소문자와 숫자로 4~20자예요.');
  }
  if (!/^(?=.*[A-Za-z])(?=.*\d).{8,20}$/.test(password)) {
    throw new ApiError(400, 'AUTH_INVALID_PASSWORD_FORMAT', '비밀번호는 영문과 숫자를 넣어 8~20자로 만들어 주세요.');
  }
}

export function checkLoginId(loginId: string) {
  if (!/^[a-z0-9]{4,20}$/.test(loginId)) {
    throw new ApiError(400, 'AUTH_INVALID_LOGIN_ID_FORMAT', '아이디는 영문 소문자와 숫자로 4~20자예요.');
  }
  return { available: !users().some((u) => u.loginId === loginId) };
}

export function signup(body: Credentials) {
  validate(body);
  if (users().some((u) => u.loginId === body.loginId)) {
    throw new ApiError(409, 'AUTH_DUPLICATE_LOGIN_ID', '이미 사용 중인 아이디예요.');
  }
  const userId = Math.max(...users().map((u) => u.userId)) + 1;
  users().push({
    userId,
    loginId: body.loginId,
    password: body.password,
    displayName: null, // 이름·관계는 0.2-1에서
    relation: null,
    subjects: [],
    pendingInvitationCount: 0,
  });
  save();
  return { userId };
}

export function login({ loginId, password }: Credentials): LoginResponse {
  if ((failures.get(loginId) ?? 0) >= MAX_FAILURES) {
    throw new ApiError(429, 'AUTH_TOO_MANY_ATTEMPTS', '잠시 후 다시 로그인해 주세요.');
  }
  const user = users().find((u) => u.loginId === loginId);
  if (!user || user.password !== password) {
    failures.set(loginId, (failures.get(loginId) ?? 0) + 1);
    throw new ApiError(401, 'AUTH_INVALID_CREDENTIALS', '아이디 또는 비밀번호가 맞지 않아요.');
  }
  failures.delete(loginId);
  return {
    accessToken: `mock.${user.userId}.${Date.now()}`,
    expiresIn: 604800,
    user: { userId: user.userId, loginId: user.loginId, displayName: user.displayName, relation: user.relation },
    subjects: user.subjects,
    pendingInvitationCount: user.pendingInvitationCount,
  };
}

/* ───────────── TERMS-01 ───────────── */

// 내용은 기획 문구 확정안 v1.4의 약관 초안. 실제 서버(TERMS-01)가 붙으면 서버 내용이 보입니다.
// TODO(기획): 운영 주체·보유 기간·외부 AI 제공업체·국외 이전 여부 확정 후 서버 약관에 반영
export const TERMS: Term[] = [
  {
    consentType: 'PRIVACY',
    termsVersion: '1.0',
    required: true,
    title: '개인정보 수집·이용 동의 (필수)',
    content: [
      '본 서비스는 회원 및 돌봄 대상자 정보 관리, 돌봄 설명서 제공, 돌봄 지원 정보 안내를 위해 다음 개인정보를 수집·이용합니다.',
      '',
      '• 수집 항목: 회원 아이디, 보호자 이름·관계, 돌봄 대상자 이름 또는 별칭, 출생 연도, 거주 지역, 입력된 연락처',
      '• 수집·이용 목적: 회원 및 돌봄 대상자 관리, 설명서 관리, 공동 관리자 초대·권한 관리, 돌봄 지원 정보 제공',
      '• 보유 기간: 회원 탈퇴 시까지. 단, 법령에 따른 별도 보존 의무가 있는 경우 해당 기간 적용',
      '• 동의 거부: 동의를 거부할 권리가 있으나 필수 정보 처리에 동의하지 않으면 서비스 이용이 제한됩니다.',
    ].join('\n'),
  },
  {
    consentType: 'SUBJECT_AUTHORITY',
    termsVersion: '1.0',
    required: true,
    title: '돌봄 대상자 정보 처리 권한 확인',
    content:
      '본인은 등록하는 돌봄 대상자의 개인정보를 제공·관리할 적법한 권한이 있으며, 대상자 본인의 의사와 권리 및 관련 법령을 준수해야 함을 확인합니다.',
  },
  {
    consentType: 'SENSITIVE_INFO',
    termsVersion: '1.0',
    required: true,
    title: '민감정보 처리 및 AI 분석 동의 (필수)',
    content: [
      '본 서비스는 보호자가 입력한 돌봄 특성 및 일기에서 돌봄 정보를 추출·정리하기 위해 민감정보와 AI 분석 기능을 처리합니다.',
      '',
      '• 처리 항목: 건강·장애·복약·행동 특성, 의사소통 정보, 돌봄 일기 내용에 포함된 민감정보',
      '• 처리 목적: 돌봄 정보 정리, 설명서 관리, 보호자 지원 안내',
      '• 보유 기간: 회원 탈퇴 시까지. 세부 기준은 개인정보 처리방침에 따름',
      '• 동의 거부: 동의를 거부할 권리가 있으나 민감정보 처리 및 AI 분석 기능 이용이 제한됩니다.',
    ].join('\n'),
  },
  {
    consentType: 'AI_PROCESSING',
    termsVersion: '1.0',
    required: true,
    title: 'AI 기반 정보 처리 안내',
    content: [
      '• AI 분석: 작성한 일기를 분석하여 돌봄 관련 항목을 추출하고, 보호자 검토·승인 후 설명서에 반영',
      '• 음성 처리: 음성 녹음은 텍스트 변환에 사용하며 원본 음성은 서버에 보관하지 않음',
      '',
      'AI 분석 결과는 전문적인 의료 진단이나 치료·상담을 대신하지 않습니다.',
    ].join('\n'),
  },
];

/* ───────────── ONB-01 ───────────── */

/** 가짜 토큰 "mock.{userId}.{시간}"에서 사용자 찾기 */
function currentUser(): MockUser {
  const token = getAccessToken();
  // 실제 서버로 로그인한 상태(토큰이 mock.으로 시작하지 않음)에서 아직 가짜인 API(홈·기록 등)를 쓸 때:
  // 이 세션의 대상자 ID로 임시 사용자를 만들어 가짜 화면이 계속 동작하게 함 (저장되지 않음)
  if (token && !token.startsWith('mock.')) {
    const subjectId = getSubjectId();
    return {
      userId: 0,
      loginId: 'server-user',
      password: '',
      displayName: null,
      relation: null,
      subjects: subjectId ? [{ subjectId, name: '대상자', role: 'OWNER' }] : [],
      pendingInvitationCount: 0,
    };
  }
  const userId = Number(token?.split('.')[1]);
  const user = users().find((u) => u.userId === userId);
  if (!user) throw new ApiError(401, 'COMMON_UNAUTHORIZED', '다시 로그인해 주세요.');
  return user;
}

export function onboard(body: OnboardingRequest): OnboardingResponse {
  const user = currentUser();
  if (user.subjects.some((s) => s.role === 'OWNER')) {
    throw new ApiError(409, 'ONB_ALREADY_COMPLETED', '이미 등록을 마쳤어요.');
  }
  const nameLength = body.subject.name.trim().length;
  if (nameLength < 2 || nameLength > 20) {
    throw new ApiError(400, 'SUBJECT_INVALID_NAME', '이름은 2~20자로 입력해 주세요.');
  }
  const thisYear = new Date().getFullYear();
  if (!Number.isInteger(body.subject.birthYear) || body.subject.birthYear < 1900 || body.subject.birthYear > thisYear) {
    throw new ApiError(400, 'SUBJECT_INVALID_BIRTH_YEAR', '태어난 연도를 다시 확인해 주세요.');
  }
  const agreed = new Set(body.consents.map((c) => c.consentType));
  if (TERMS.some((t) => t.required && !agreed.has(t.consentType))) {
    throw new ApiError(400, 'SUBJECT_CONSENT_REQUIRED', '필수 동의 항목에 동의해 주세요.');
  }

  const subjectId = Math.max(10, ...users().flatMap((u) => u.subjects.map((s) => s.subjectId))) + 1;
  user.displayName = body.guardian.displayName.trim();
  user.relation = body.guardian.relation;
  user.subjects.push({ subjectId, name: body.subject.name.trim(), role: 'OWNER' });
  save();

  // 빈 답변은 설명서 항목을 만들지 않음 (명세 ONB-01)
  const createdGuideEntryCount = Object.values(body.profile).filter((a) => a && a.trim()).length;
  return { subjectId, createdGuideEntryCount };
}

/* ───────────── HOME-01 중 대상자·역할 부분 ───────────── */

/** 로그인한 사용자가 보고 있는 대상자 (getSubjectId 기준) */
export function currentSubject(subjectId: number) {
  const user = currentUser();
  const subject = user.subjects.find((s) => s.subjectId === subjectId);
  if (!subject) throw new ApiError(403, 'COMMON_FORBIDDEN', '이용할 수 있는 권한이 없어요.');
  return { ...subject, pendingInvitationCount: user.pendingInvitationCount };
}

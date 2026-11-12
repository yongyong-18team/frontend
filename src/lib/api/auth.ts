// src/lib/api/auth.ts
// 인증 API (API 명세 2-1, 백엔드 A) — 모두 로그인 없이 부르므로 { auth: false }
// NEXT_PUBLIC_REAL_API에 auth가 있으면 실제 서버, 없으면 가짜 계정(mock/auth.ts) (realApi.ts 참고)
//
// 가짜 서버 개발용 계정: 아이디 demo1234 / 비밀번호 demo1234 (돌봄 대상자 있음 → 홈으로)
// 새로 가입한 계정은 대상자가 없어서 → 온보딩(0.2)으로

import { api, ApiError } from '@/lib/api/client';
import type { LoginSessionData } from '@/lib/auth/session';
import * as mock from '@/lib/api/mock/auth';
import { isReal } from '@/lib/api/realApi';

export type Relation = 'PARENT' | 'OTHER';

/** AUTH-03 응답 */
export type LoginResponse = LoginSessionData & {
  user: { userId: number; loginId: string; displayName: string | null; relation: Relation | null };
  pendingInvitationCount: number;
};

export type Credentials = { loginId: string; password: string };

/* ───────────── 형식 검사 (AUTH-01 규칙, 서버와 같은 기준) ───────────── */

/** 4~20자, 영문 소문자·숫자 */
export const LOGIN_ID_RULE = /^[a-z0-9]{4,20}$/;
/** 8~20자, 영문·숫자 포함 */
export const PASSWORD_RULE = /^(?=.*[A-Za-z])(?=.*\d).{8,20}$/;

export const LOGIN_ID_HINT = '영문 소문자와 숫자로 4~20자 입력해 주세요.';
export const PASSWORD_HINT = '영문과 숫자를 포함해 8~20자 입력해 주세요.';

export const isValidLoginId = (value: string) => LOGIN_ID_RULE.test(value);
export const isValidPassword = (value: string) => PASSWORD_RULE.test(value);

/* ───────────── API ───────────── */

/** AUTH-03 로그인. 실패: AUTH_INVALID_CREDENTIALS 401, AUTH_TOO_MANY_ATTEMPTS 429 */
export async function login(body: Credentials): Promise<LoginResponse> {
  if (isReal('auth')) return api.post<LoginResponse>('/auth/login', body, { auth: false });

  // ── 가짜 응답 ──
  await mock.delay(600);
  return mock.login(body);
}

/** AUTH-01 회원가입. 실패: 형식 400, AUTH_DUPLICATE_LOGIN_ID 409 */
export async function signup(body: Credentials): Promise<{ userId: number }> {
  if (isReal('auth')) return api.post<{ userId: number }>('/auth/signup', body, { auth: false });

  // ── 가짜 응답 ──
  await mock.delay(600);
  return mock.signup(body);
}

/**
 * AUTH-02 아이디 중복 확인
 * 실제 서버: 사용 가능하면 200 + data:null, 이미 있으면 오류(AUTH_DUPLICATE_LOGIN_ID, 409)로 보는 방식.
 * 혹시 { available: boolean }을 보내도 그대로 쓰도록 둘 다 처리
 * TODO(백엔드 A): 이미 있는 아이디일 때 응답(상태 코드·오류 코드) 확인
 */
export async function checkLoginId(loginId: string): Promise<{ available: boolean }> {
  if (isReal('auth')) {
    try {
      const data = await api.get<{ available?: boolean } | null>('/auth/login-id/check', {
        query: { loginId },
        auth: false,
      });
      return { available: data?.available ?? true };
    } catch (err) {
      if (err instanceof ApiError && (err.code === 'AUTH_DUPLICATE_LOGIN_ID' || err.status === 409)) {
        return { available: false };
      }
      throw err;
    }
  }

  // ── 가짜 응답 ──
  await mock.delay(400);
  return mock.checkLoginId(loginId);
}

/* ───────────── 로그인 후 이동 (AUTH-03 "로그인 후 화면 분기") ───────────── */

const HOME_PATH = '/home';
const ONBOARDING_PATH = '/onboarding/step-1';
// TODO(B): 6.2.1 받은 초대 확인 화면 주소 확인
const INVITATIONS_PATH = '/settings/invitations';

/** 같은 사이트 안의 주소만 허용 (외부 주소로 보내는 것 방지) */
function safeNext(next: string | null | undefined) {
  // 첫 주소(/)는 홈과 같으니 홈으로
  if (!next || next === '/' || !next.startsWith('/') || next.startsWith('//') || next.startsWith('/login')) return null;
  return next;
}

/**
 * - 대상자가 있으면 1.1 홈 (로그인 전에 보던 화면이 있으면 그쪽)
 * - 대상자가 없고 받은 초대가 있으면 6.2.1
 * - 둘 다 없으면 0.2-1 온보딩
 */
export function pathAfterLogin(res: Pick<LoginResponse, 'subjects' | 'pendingInvitationCount'>, next?: string | null) {
  if (res.subjects.length > 0) return safeNext(next) ?? HOME_PATH;
  if (res.pendingInvitationCount > 0) return INVITATIONS_PATH;
  return ONBOARDING_PATH;
}

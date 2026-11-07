// src/lib/auth/session.ts
// 로그인 상태 보관 (API 명세 1. 공통 규약 기준)
//
// - access token은 localStorage에 저장하고, 요청마다 Authorization 헤더로 보냅니다. 쿠키는 쓰지 않습니다.
// - 토큰은 7일 유효, 갱신(Refresh) 없음. 만료되면 다시 로그인합니다.
// - 로그아웃 = 이 파일의 clearSession() (서버 호출 없음)
// - /subjects/{subjectId}/… API에 쓸 대상자 ID도 함께 보관합니다. (MVP는 사용자당 대상자 1명)
//
// 사용 예
//   로그인 성공(AUTH-03)  → saveLogin(response)
//   온보딩 완료(ONB-01)  → setSubjectId(response.subjectId)
//   초대 수락(INVITE-05) → setSubjectId(response.subjectId)
//   로그아웃·탈퇴        → clearSession()

const TOKEN_KEY = 'yongyong.accessToken';
const EXPIRES_AT_KEY = 'yongyong.tokenExpiresAt';
const SUBJECT_ID_KEY = 'yongyong.subjectId';

export type SubjectRole = 'OWNER' | 'CO_MANAGER';

export type SubjectSummary = {
  subjectId: number;
  name: string;
  /** TODO(백엔드 A): AUTH-03 예시는 OWNER, INVITE-05 예시는 CO_MANAGER — 공동 관리자 값 이름 확인 */
  role: SubjectRole | string;
};

/** AUTH-03 로그인 응답 중 세션에 필요한 부분 */
export type LoginSessionData = {
  accessToken: string;
  /** 초 단위 (604800 = 7일) */
  expiresIn: number;
  subjects: SubjectSummary[];
};

/* ───────────── localStorage 안전하게 쓰기 ─────────────
   서버 렌더링 중이거나, 사생활 보호 모드·저장 공간 차단이면 실패할 수 있어 모두 감쌉니다. */

function read(key: string): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string | null) {
  if (typeof window === 'undefined') return;
  try {
    if (value === null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, value);
  } catch {
    /* 저장 실패 시에는 이번 방문 동안 로그인이 유지되지 않을 수 있음 */
  }
  window.dispatchEvent(new Event(SESSION_EVENT));
}

/* ───────────── 로그인 상태 변화 알림 (AuthGuard 등에서 사용) ───────────── */

const SESSION_EVENT = 'yongyong:session';

/** 로그인·로그아웃(다른 탭 포함) 때 callback 호출. 해제 함수를 돌려줌 */
export function subscribeSession(callback: () => void) {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener(SESSION_EVENT, callback);
  window.addEventListener('storage', callback);
  return () => {
    window.removeEventListener(SESSION_EVENT, callback);
    window.removeEventListener('storage', callback);
  };
}

/* ───────────── 토큰 ───────────── */

/** 저장된 토큰. 없거나 만료됐으면 null (만료된 토큰은 지움) */
export function getAccessToken(): string | null {
  const token = read(TOKEN_KEY);
  if (!token) return null;

  const expiresAt = Number(read(EXPIRES_AT_KEY));
  if (expiresAt && Date.now() >= expiresAt) {
    clearSession();
    return null;
  }
  return token;
}

export function setAccessToken(token: string, expiresInSeconds?: number) {
  write(TOKEN_KEY, token);
  write(EXPIRES_AT_KEY, expiresInSeconds ? String(Date.now() + expiresInSeconds * 1000) : null);
}

export function isLoggedIn() {
  return getAccessToken() !== null;
}

/* ───────────── 대상자 ───────────── */

export function getSubjectId(): number | null {
  const value = Number(read(SUBJECT_ID_KEY));
  return Number.isFinite(value) && value > 0 ? value : null;
}

export function setSubjectId(subjectId: number | null) {
  write(SUBJECT_ID_KEY, subjectId === null ? null : String(subjectId));
}

/* ───────────── 로그인·로그아웃 ───────────── */

/** 로그인 응답(AUTH-03)을 저장. 대상자가 있으면 첫 번째 대상자를 현재 대상자로 */
export function saveLogin(data: LoginSessionData) {
  setAccessToken(data.accessToken, data.expiresIn);
  setSubjectId(data.subjects[0]?.subjectId ?? null);
}

/** 로그아웃: 토큰과 대상자 ID 삭제 */
export function clearSession() {
  write(TOKEN_KEY, null);
  write(EXPIRES_AT_KEY, null);
  write(SUBJECT_ID_KEY, null);
}

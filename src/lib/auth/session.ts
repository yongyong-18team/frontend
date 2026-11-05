// src/lib/auth/session.ts
// 토큰 보관과 갱신을 담당합니다.
//
// 방식 (백엔드 A와 확정 필요)
// - access token: 브라우저 메모리에만 보관 (localStorage에 저장하지 않음)
// - refresh token: 백엔드가 httpOnly 쿠키로 내려줌 → JS에서 읽을 수 없어 안전
// - 새로고침하면 메모리가 비므로, 앱 시작 시 refreshAccessToken()으로 다시 받아옴
//
// TODO: 백엔드 A에게 갱신 API 주소와 응답 필드 이름 확인 후 아래 두 값 수정

const REFRESH_PATH = '/auth/refresh'; // TODO: 실제 경로로 교체
const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? '';

let accessToken: string | null = null;
let refreshing: Promise<boolean> | null = null;

export function getAccessToken() {
  return accessToken;
}

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function clearSession() {
  accessToken = null;
}

/** 동시에 여러 요청이 401을 받아도 갱신 요청은 한 번만 보냄 */
export function refreshAccessToken(): Promise<boolean> {
  if (refreshing) return refreshing;

  refreshing = (async () => {
    try {
      const res = await fetch(`${BASE_URL}${REFRESH_PATH}`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!res.ok) return false;
      const data = await res.json();
      setAccessToken(data.accessToken ?? null); // TODO: 응답 필드 이름 확인
      return Boolean(accessToken);
    } catch {
      return false;
    } finally {
      refreshing = null;
    }
  })();

  return refreshing;
}

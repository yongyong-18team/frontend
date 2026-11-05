// src/lib/api/client.ts
// 모든 API 요청은 이 파일의 `api`를 통해 보냅니다.
//
// 기본 동작
// - 로그인한 사용자 요청: Authorization 헤더에 토큰을 붙임
// - 401이면 토큰 갱신을 한 번 시도하고, 실패하면 /login으로 이동
//
// 로그인 없는 요청 (예: PUB-01 수신자 페이지 /s/[token])
// - 옵션에 { auth: false }를 넘기면 토큰을 붙이지 않고,
//   401이 와도 로그인 화면으로 보내지 않고 ApiError만 던짐
//   예) api.get(`/public/shares/${token}`, { auth: false })

import { clearSession, getAccessToken, refreshAccessToken } from '@/lib/auth/session';

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? '';

export class ApiError extends Error {
  constructor(
    public status: number,
    public code?: string,
    message?: string,
    public body?: unknown,
  ) {
    super(message ?? `API 요청 실패 (${status})`);
    this.name = 'ApiError';
  }
}

type Query = Record<string, string | number | boolean | null | undefined>;

export type RequestOptions = Omit<RequestInit, 'body' | 'method'> & {
  body?: unknown;
  query?: Query;
  /** 기본값 true. false면 토큰 없이 보내고 401이어도 로그인으로 보내지 않음 */
  auth?: boolean;
};

function buildUrl(path: string, query?: Query) {
  const url = new URL(path, BASE_URL || window.location.origin);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null) url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

function goToLogin() {
  if (typeof window === 'undefined') return;
  const next = window.location.pathname + window.location.search;
  window.location.href = `/login?next=${encodeURIComponent(next)}`;
}

async function request<T>(
  method: string,
  path: string,
  options: RequestOptions = {},
  retried = false,
): Promise<T> {
  const { body, query, auth = true, headers, ...rest } = options;

  const h = new Headers(headers);
  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
  if (body !== undefined && !isFormData) h.set('Content-Type', 'application/json');

  if (auth) {
    const token = getAccessToken();
    if (token) h.set('Authorization', `Bearer ${token}`);
  }

  const res = await fetch(buildUrl(path, query), {
    ...rest,
    method,
    headers: h,
    // 녹음 파일 업로드는 FormData 그대로, 나머지는 JSON
    body: body === undefined ? undefined : isFormData ? (body as FormData) : JSON.stringify(body),
    credentials: 'include',
  });

  if (res.status === 401 && auth) {
    if (!retried && (await refreshAccessToken())) {
      return request<T>(method, path, options, true);
    }
    clearSession();
    goToLogin();
    throw new ApiError(401, 'UNAUTHORIZED', '로그인이 필요합니다.');
  }

  if (!res.ok) {
    const data = await res.json().catch(() => undefined);
    throw new ApiError(res.status, data?.code, data?.message, data);
  }

  if (res.status === 204) return undefined as T;
  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

export const api = {
  get: <T>(path: string, options?: RequestOptions) => request<T>('GET', path, options),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>('POST', path, { ...options, body }),
  put: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>('PUT', path, { ...options, body }),
  patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>('PATCH', path, { ...options, body }),
  delete: <T>(path: string, options?: RequestOptions) => request<T>('DELETE', path, options),
};

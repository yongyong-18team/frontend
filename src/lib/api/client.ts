// src/lib/api/client.ts
// 모든 API 요청은 이 파일의 `api`를 통해 보냅니다. (API 명세 1. 공통 규약 기준)
//
// 하는 일
// - 주소 앞에 {NEXT_PUBLIC_API_BASE_URL}/api/v1 을 붙임
// - 로그인 토큰을 Authorization: Bearer 헤더로 붙임 (쿠키 안 씀)
// - 응답 { success, data, error } 에서 data만 꺼내 돌려줌
// - 실패하면 ApiError를 던짐 → 화면에서는 error.code로 분기, error.message를 그대로 보여주면 됨
// - 401이면 토큰을 지우고 로그인(0.1)으로 이동 (토큰 갱신 없음)
// - 시간 제한 (기본 15초, 옵션으로 변경)
//
// 사용 예
//   const me = await api.get<Me>('/users/me');
//   const list = await api.get<Page>(subjectPath('/diaries'), { query: { from, to, page: 0, size: 20 } });
//   const result = await api.post<Analysis>(subjectPath(`/diaries/${id}/analyze`), undefined, { timeoutMs: 35_000 });
//
// 로그인 없이 부르는 API (토큰 안 붙이고, 401이어도 로그인으로 보내지 않음)
//   - AUTH-01·02·03 (가입·아이디 확인·로그인), TERMS-01, PUB-01 (수신자 페이지 /s/{token})
//   api.post('/auth/login', body, { auth: false })
//   api.get(`/public/shares/${token}`, { auth: false })

import { clearSession, getAccessToken, getSubjectId } from '@/lib/auth/session';

const API_PREFIX = '/api/v1';
const BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL ?? '').replace(/\/+$/, '');

const DEFAULT_TIMEOUT_MS = 15_000;
const LOGIN_PATH = '/login';

/** 서버 응답 형식 */
export type ApiEnvelope<T> =
  | { success: true; data: T; error: null }
  | { success: false; data: null; error: { code: string; message: string } };

/** 클라이언트에서 만드는 오류 코드 (서버 코드는 명세 4. 에러 코드 참고) */
export const CLIENT_ERROR = {
  NETWORK: 'CLIENT_NETWORK_ERROR',
  TIMEOUT: 'CLIENT_TIMEOUT',
  NO_SUBJECT: 'CLIENT_NO_SUBJECT',
  BAD_RESPONSE: 'CLIENT_BAD_RESPONSE',
} as const;

const FALLBACK_MESSAGE = '잠시 후 다시 시도해 주세요.';

export class ApiError extends Error {
  constructor(
    /** HTTP 상태. 네트워크 오류·시간 초과는 0 */
    public status: number,
    /** 서버 error.code (예: AUTH_INVALID_CREDENTIALS) 또는 CLIENT_ERROR 값 */
    public code: string,
    message?: string,
  ) {
    super(message || FALLBACK_MESSAGE);
    this.name = 'ApiError';
  }
}

/** 화면에 보여줄 문구. ApiError면 서버가 준 메시지, 아니면 기본 문구 */
export function getErrorMessage(error: unknown) {
  return error instanceof ApiError ? error.message : FALLBACK_MESSAGE;
}

/** /subjects/{현재 대상자 ID}{path}. 대상자가 없으면(온보딩 전) ApiError(CLIENT_NO_SUBJECT) */
export function subjectPath(path = '') {
  const subjectId = getSubjectId();
  if (subjectId === null) {
    throw new ApiError(0, CLIENT_ERROR.NO_SUBJECT, '돌봄 대상자 등록이 필요해요.');
  }
  return `/subjects/${subjectId}${path}`;
}

type Query = Record<string, string | number | boolean | null | undefined>;

export type RequestOptions = Omit<RequestInit, 'body' | 'method'> & {
  body?: unknown;
  query?: Query;
  /** 기본 true. false면 토큰 없이 보내고 401이어도 로그인으로 보내지 않음 */
  auth?: boolean;
  /** 시간 제한(ms). 기본 15초. DIARY-02 분석은 30초 이상, STT-01은 30초 권장 */
  timeoutMs?: number;
};

function buildUrl(path: string, query?: Query) {
  const params = new URLSearchParams();
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null && value !== '') params.set(key, String(value));
    }
  }
  const qs = params.toString();
  return `${BASE_URL}${API_PREFIX}${path}${qs ? `?${qs}` : ''}`;
}

function goToLogin() {
  if (typeof window === 'undefined') return;
  const { pathname, search } = window.location;
  if (pathname.startsWith(LOGIN_PATH)) return; // 로그인 화면에서는 다시 이동하지 않음
  window.location.href = `${LOGIN_PATH}?next=${encodeURIComponent(pathname + search)}`;
}

function isEnvelope(value: unknown): value is ApiEnvelope<unknown> {
  return typeof value === 'object' && value !== null && typeof (value as { success?: unknown }).success === 'boolean';
}

async function request<T>(method: string, path: string, options: RequestOptions = {}): Promise<T> {
  const { body, query, auth = true, timeoutMs = DEFAULT_TIMEOUT_MS, headers, signal, ...rest } = options;

  const h = new Headers(headers);
  h.set('Accept', 'application/json');
  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
  if (body !== undefined && !isFormData) h.set('Content-Type', 'application/json');

  if (auth) {
    const token = getAccessToken();
    if (token) h.set('Authorization', `Bearer ${token}`);
  }

  // 시간 제한 + 화면에서 넘긴 취소 신호를 함께 사용
  const controller = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);
  const onOuterAbort = () => controller.abort();
  signal?.addEventListener('abort', onOuterAbort);

  let res: Response;
  try {
    res = await fetch(buildUrl(path, query), {
      ...rest,
      method,
      headers: h,
      // 녹음 파일(STT-01)은 FormData 그대로, 나머지는 JSON
      body: body === undefined ? undefined : isFormData ? (body as FormData) : JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (e) {
    if (timedOut) throw new ApiError(0, CLIENT_ERROR.TIMEOUT, '응답이 늦어지고 있어요. 잠시 후 다시 시도해 주세요.');
    if (signal?.aborted) throw e; // 화면이 직접 취소한 경우는 그대로
    throw new ApiError(0, CLIENT_ERROR.NETWORK, '인터넷 연결을 확인해 주세요.');
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', onOuterAbort);
  }

  // 본문 읽기 (204 등 본문 없음 허용)
  const text = await res.text();
  let json: unknown = undefined;
  if (text) {
    try {
      json = JSON.parse(text);
    } catch {
      json = undefined;
    }
  }

  const envelope = isEnvelope(json) ? json : null;

  if (!res.ok || (envelope && !envelope.success)) {
    const code = envelope?.error?.code ?? `HTTP_${res.status}`;
    const message = envelope?.error?.message;

    if (res.status === 401 && auth) {
      clearSession();
      goToLogin();
    }
    throw new ApiError(res.status, code, message);
  }

  if (envelope) return envelope.data as T;
  if (json === undefined) return undefined as T; // 본문 없는 성공
  throw new ApiError(res.status, CLIENT_ERROR.BAD_RESPONSE, '응답 형식이 올바르지 않아요.');
}

export const api = {
  get: <T>(path: string, options?: RequestOptions) => request<T>('GET', path, options),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) => request<T>('POST', path, { ...options, body }),
  put: <T>(path: string, body?: unknown, options?: RequestOptions) => request<T>('PUT', path, { ...options, body }),
  patch: <T>(path: string, body?: unknown, options?: RequestOptions) => request<T>('PATCH', path, { ...options, body }),
  delete: <T>(path: string, options?: RequestOptions) => request<T>('DELETE', path, options),
};

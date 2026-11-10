// src/components/auth/LoginForm.tsx
// 0.1-A 로그인 기본 (Figma 33:1530) / 0.1-B 로그인 오류 (Figma 33:1572)
// AUTH-03 → 토큰·대상자 저장 → 대상자 있으면 홈(또는 로그인 전에 보던 화면), 없으면 초대 확인·온보딩

'use client';

import { useState, useSyncExternalStore, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';

import Button from '@/components/common/Button';
import AuthField from '@/components/auth/AuthField';
import SocialLogin from '@/components/auth/SocialLogin';
import { ApiError, getErrorMessage, SESSION_EXPIRED_MESSAGE } from '@/lib/api/client';
import { login, pathAfterLogin } from '@/lib/api/auth';
import { saveLogin } from '@/lib/auth/session';

const INVALID_CREDENTIALS_MESSAGE = '아이디 또는 비밀번호가 일치하지 않습니다.';

const noop = () => () => {};
/** 로그인이 만료돼서 온 경우(?expired=1) */
const readExpired = () => new URLSearchParams(window.location.search).has('expired');

export default function LoginForm() {
  const router = useRouter();
  const expired = useSyncExternalStore(noop, readExpired, () => false);
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  /** 아이디·비밀번호 불일치 → 비밀번호 칸 아래 (Figma 0.1-B) */
  const [credentialError, setCredentialError] = useState<string | null>(null);
  /** 그 밖의 오류(시도 횟수 초과, 네트워크 등) → 버튼 위 */
  const [formError, setFormError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const canSubmit = loginId.trim().length > 0 && password.length > 0 && !submitting;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setCredentialError(null);
    setFormError(null);
    try {
      const res = await login({ loginId: loginId.trim(), password });
      saveLogin(res);
      const next = new URLSearchParams(window.location.search).get('next');
      router.replace(pathAfterLogin(res, next));
    } catch (err) {
      // 아이디·비밀번호 불일치는 서버 문구 대신 기획 문구 확정안 v1.4 0.1 문구 (401 + 로그인 화면이라 이 코드로 판단)
      if (err instanceof ApiError && (err.code === 'AUTH_INVALID_CREDENTIALS' || err.status === 401)) {
        setCredentialError(INVALID_CREDENTIALS_MESSAGE);
      } else {
        setFormError(getErrorMessage(err));
      }
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      <AuthField
        id="login-id"
        label="아이디 *"
        value={loginId}
        onChange={(e) => {
          setLoginId(e.target.value);
          setCredentialError(null);
        }}
        placeholder="아이디를 입력해 주세요"
        autoComplete="username"
        autoCapitalize="none"
        spellCheck={false}
        maxLength={20}
      />
      <AuthField
        id="login-password"
        label="비밀번호 *"
        type="password"
        value={password}
        onChange={(e) => {
          setPassword(e.target.value);
          setCredentialError(null);
        }}
        placeholder="비밀번호를 입력해 주세요"
        autoComplete="current-password"
        maxLength={20}
        status={credentialError ? 'error' : 'default'}
        helper={credentialError}
      />

      <div className="mt-1.5 flex flex-col gap-2">
        {expired && !formError && !credentialError && (
          <p className="text-center text-caption text-text-secondary" role="status">
            {SESSION_EXPIRED_MESSAGE}
          </p>
        )}
        {formError && (
          <p className="text-center text-caption text-pink-strong" role="alert">
            {formError}
          </p>
        )}
        <Button type="submit" disabled={!canSubmit}>
          {submitting ? '로그인 중…' : '로그인'}
        </Button>
      </div>

      {/* TODO(기획): 아이디·비밀번호 찾기 API가 명세에 없음 */}
      <p className="flex items-center justify-center gap-3 text-caption leading-[1.45] text-text-secondary">
        <button type="button" onClick={() => setNotice('아이디 찾기는 준비 중이에요.')}>
          아이디 찾기
        </button>
        <span aria-hidden>|</span>
        <button type="button" onClick={() => setNotice('비밀번호 찾기는 준비 중이에요.')}>
          비밀번호 찾기
        </button>
      </p>

      <div className="flex items-center gap-[10px]" aria-hidden>
        <span className="h-px flex-1 bg-line-strong" />
        <span className="text-micro leading-[1.45] font-medium text-text-tertiary">간편 로그인</span>
        <span className="h-px flex-1 bg-line-strong" />
      </div>
      <SocialLogin onUnavailable={() => setNotice('간편 로그인은 준비 중이에요.')} />

      {notice && (
        <p className="text-center text-caption text-text-secondary" role="status">
          {notice}
        </p>
      )}
    </form>
  );
}

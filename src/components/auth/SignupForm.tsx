// src/components/auth/SignupForm.tsx
// 0.1-C 회원가입 (Figma 34:1617) + [상태] 아이디 사용 가능 (59:2340) / 아이디 사용 중 (59:2375)
// 아이디 중복 확인(AUTH-02) → 가입(AUTH-01) → 바로 로그인(AUTH-03) → 대상자가 없으니 0.2 온보딩으로
// 이름·관계는 0.2-1에서 받습니다 (명세 AUTH-01)

'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';

import Button from '@/components/common/Button';
import AuthField from '@/components/auth/AuthField';
import SocialLogin from '@/components/auth/SocialLogin';
import { ApiError, getErrorMessage } from '@/lib/api/client';
import {
  checkLoginId,
  isValidLoginId,
  isValidPassword,
  login,
  LOGIN_ID_HINT,
  PASSWORD_HINT,
  pathAfterLogin,
  signup,
} from '@/lib/api/auth';
import { saveLogin } from '@/lib/auth/session';

/** 아이디 확인 상태: 아직 안 함 / 확인 중 / 사용 가능 / 사용 중 / 형식 오류 */
type IdCheck = 'idle' | 'checking' | 'available' | 'taken' | 'invalid';

export default function SignupForm() {
  const router = useRouter();
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [idCheck, setIdCheck] = useState<IdCheck>('idle');
  const [idMessage, setIdMessage] = useState<string | null>(null);
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const passwordInvalid = passwordTouched && password.length > 0 && !isValidPassword(password);

  const handleCheckId = async () => {
    const id = loginId.trim();
    if (!isValidLoginId(id)) {
      setIdCheck('invalid');
      setIdMessage(LOGIN_ID_HINT);
      return;
    }
    setIdCheck('checking');
    setIdMessage(null);
    try {
      const { available } = await checkLoginId(id);
      setIdCheck(available ? 'available' : 'taken');
      setIdMessage(available ? '사용할 수 있는 아이디예요.' : '이미 사용 중인 아이디예요.');
    } catch (err) {
      setIdCheck('invalid');
      setIdMessage(getErrorMessage(err));
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setPasswordTouched(true);

    if (idCheck !== 'available') {
      setIdCheck(idCheck === 'taken' ? 'taken' : 'invalid');
      setIdMessage(idCheck === 'taken' ? '이미 사용 중인 아이디예요.' : '아이디 중복 확인을 해 주세요.');
      return;
    }
    if (!isValidPassword(password)) return;

    setSubmitting(true);
    const credentials = { loginId: loginId.trim(), password };
    try {
      await signup(credentials);
      const res = await login(credentials);
      saveLogin(res);
      router.replace(pathAfterLogin(res));
    } catch (err) {
      if (err instanceof ApiError && err.code === 'AUTH_DUPLICATE_LOGIN_ID') {
        setIdCheck('taken');
        setIdMessage(err.message);
      } else if (err instanceof ApiError && err.code === 'AUTH_INVALID_LOGIN_ID_FORMAT') {
        setIdCheck('invalid');
        setIdMessage(err.message);
      } else {
        setFormError(getErrorMessage(err));
      }
      setSubmitting(false);
    }
  };

  const idStatus = idCheck === 'available' ? 'success' : idCheck === 'taken' || idCheck === 'invalid' ? 'error' : 'default';

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      {/* 아이디 + 중복 확인: 버튼은 입력칸 높이에 맞춤 (안내 문구가 생겨도 위치 고정) */}
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <AuthField
            id="signup-id"
            label="아이디 *"
            value={loginId}
            onChange={(e) => {
              setLoginId(e.target.value.toLowerCase());
              // 아이디를 바꾸면 다시 확인해야 함
              setIdCheck('idle');
              setIdMessage(null);
            }}
            placeholder="영문 소문자·숫자 4~20자"
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            maxLength={20}
            status={idStatus}
            helper={idMessage}
          />
        </div>
        <div className="shrink-0 pt-[30px]">
          <Button
            variant="soft"
            fullWidth={false}
            className="w-24 px-0!"
            onClick={handleCheckId}
            disabled={idCheck === 'checking' || submitting || !loginId.trim()}
          >
            {idCheck === 'checking' ? '확인 중' : '중복 확인'}
          </Button>
        </div>
      </div>

      <AuthField
        id="signup-password"
        label="비밀번호 *"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        onBlur={() => setPasswordTouched(true)}
        placeholder="영문·숫자 포함 8~20자"
        autoComplete="new-password"
        maxLength={20}
        status={passwordInvalid ? 'error' : 'default'}
        helper={passwordInvalid ? PASSWORD_HINT : null}
      />

      <div className="mt-1.5 flex flex-col gap-2">
        {formError && (
          <p className="text-center text-caption text-pink-strong" role="alert">
            {formError}
          </p>
        )}
        {/* 사용 중인 아이디면 비활성 (Figma 59:2375) */}
        <Button type="submit" disabled={submitting || idCheck === 'taken' || !loginId.trim() || !password}>
          {submitting ? '가입하는 중…' : '가입하기'}
        </Button>
      </div>

      <p className="text-center text-caption leading-[1.45] text-text-tertiary">계정을 연동해 간편 로그인을 할 수 있어요</p>
      <SocialLogin onUnavailable={() => setNotice('간편 로그인은 준비 중이에요.')} />

      {notice && (
        <p className="text-center text-caption text-text-secondary" role="status">
          {notice}
        </p>
      )}
    </form>
  );
}

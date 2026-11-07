// src/hooks/useOnboardingGate.ts
// 0.2 각 단계 화면에 들어올 때 확인
//   - 이미 대상자가 있으면(등록 끝남) → 홈
//   - 앞 단계를 안 채우고 주소로 바로 들어오면 → 채워야 할 단계로
// ready가 true가 될 때까지 화면은 비워 둡니다 (빈 값이 잠깐 보였다가 바뀌지 않게)

'use client';

import { useEffect, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';

import { getSubjectId, subscribeSession } from '@/lib/auth/session';
import { isGuardianDone, isSubjectDone, useOnboardingDraft } from '@/lib/onboarding/draft';

const noop = () => () => {};

export function useOnboardingGate(step: 1 | 2 | 3 | 4) {
  const router = useRouter();
  const draft = useOnboardingDraft();
  const isClient = useSyncExternalStore(noop, () => true, () => false);
  const subjectId = useSyncExternalStore(subscribeSession, getSubjectId, () => null);

  let redirect: string | null = null;
  if (isClient) {
    if (subjectId !== null) redirect = '/home';
    else if (step >= 2 && !isGuardianDone(draft)) redirect = '/onboarding/step-1';
    else if (step >= 3 && !isSubjectDone(draft)) redirect = '/onboarding/step-2';
  }

  useEffect(() => {
    if (redirect) router.replace(redirect);
  }, [redirect, router]);

  return { draft, ready: isClient && redirect === null };
}

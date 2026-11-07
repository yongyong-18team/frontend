// src/components/auth/AuthGuard.tsx
// 로그인 안 한 사람이 보호된 화면에 들어오면 /login?next=원래주소 로 보냅니다.
//   - 로그인 없이 볼 수 있는 화면: /login, /s/ (공유 링크)
//   - 개발 중 끄고 싶으면 .env.local 에 NEXT_PUBLIC_AUTH_GUARD=off
// layout.tsx 에서 {children} 을 감싸서 씁니다.

'use client';

import { useEffect, useSyncExternalStore, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';

import { isLoggedIn, subscribeSession } from '@/lib/auth/session';

const PUBLIC_PREFIXES = ['/login', '/s/'];
const GUARD_OFF = process.env.NEXT_PUBLIC_AUTH_GUARD === 'off';

function isPublic(pathname: string) {
  return PUBLIC_PREFIXES.some((p) => pathname === p || pathname.startsWith(p.endsWith('/') ? p : `${p}/`));
}

export default function AuthGuard({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? '/';
  const router = useRouter();
  // 서버에서는 null(아직 모름) → 브라우저에서 true/false
  const loggedIn = useSyncExternalStore(subscribeSession, isLoggedIn, () => null);

  const needsLogin = !GUARD_OFF && !isPublic(pathname) && loggedIn === false;

  useEffect(() => {
    if (!needsLogin) return;
    const next = pathname + window.location.search;
    router.replace(`/login?next=${encodeURIComponent(next)}`);
  }, [needsLogin, pathname, router]);

  if (GUARD_OFF || isPublic(pathname)) return <>{children}</>;
  // 확인 전이거나 로그인 화면으로 보내는 중엔 빈 화면 (보호된 내용이 잠깐 보이지 않게)
  if (loggedIn !== true) return null;
  return <>{children}</>;
}

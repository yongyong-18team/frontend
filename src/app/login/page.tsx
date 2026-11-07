// src/app/login/page.tsx
// 0.1 로그인·회원가입 — 화면은 AuthScreen이 그립니다. (하단 탭은 BottomNav의 HIDDEN_PREFIXES로 숨김)
// 로그인 후 돌아갈 주소(?next=)는 화면에서 직접 읽어서, 이 페이지는 params/searchParams를 읽지 않습니다.

import AuthScreen from '@/components/auth/AuthScreen';

export default function Page() {
  return <AuthScreen />;
}

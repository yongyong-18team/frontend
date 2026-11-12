// src/app/page.tsx
// 첫 주소(/)는 바로 1.1 홈으로 보냄
//   로그인 안 했으면 AuthGuard가 로그인 화면으로 보내고, 로그인하면 홈으로 돌아옴
//   (예전 "디자인 토큰 적용 테스트" 화면은 개발 초기 확인용이라 제거)

import { redirect } from 'next/navigation';

export default function Page() {
  redirect('/home');
}

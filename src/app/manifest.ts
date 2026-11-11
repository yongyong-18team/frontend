// src/app/manifest.ts
// 홈 화면에 추가(PWA)용 manifest — Next.js가 /manifest.webmanifest 로 만들고 <head>에 자동 연결합니다.
// 아이콘: public/icons (로고 public/images/logo.png 에서 만듦), 아이폰용은 src/app/apple-icon.png
// TODO(기획): 앱 이름 "용용"·설명 문구 확정 여부 확인

import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: '용용',
    short_name: '용용',
    description: '오늘의 기록이 내일의 돌봄이 됩니다',
    lang: 'ko',
    start_url: '/home',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#FFF8F1', // globals.css --color-bg-base
    theme_color: '#FFF8F1',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      // 안드로이드가 원·둥근 사각형으로 잘라도 그림이 안 잘리게 여백을 둔 버전
      { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}

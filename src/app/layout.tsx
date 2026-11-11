import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { Noto_Sans_KR } from "next/font/google";
import AuthGuard from '@/components/auth/AuthGuard';
import BottomNav from "@/components/common/BottomNav";
import "./globals.css";

const notoSansKr = Noto_Sans_KR({
  variable: "--font-noto-sans-kr",
  weight: ["400", "500", "700"],
  display: "swap",
  preload: false,
});

// manifest·아이콘은 src/app/manifest.ts · apple-icon.png 가 자동으로 연결됨
export const metadata: Metadata = {
  title: "돌봄바통",
  description: "오늘의 기록이 내일의 돌봄이 됩니다",
  appleWebApp: { capable: true, title: "돌봄바통", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: "#FFF8F1",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className={`${notoSansKr.variable} h-full antialiased`}>
      <body className="mx-auto flex min-h-full w-full max-w-[430px] flex-col font-sans">
        <Suspense fallback={null}>
          <AuthGuard>{children}</AuthGuard>
          <BottomNav />
        </Suspense>
      </body>
    </html>
  );
}
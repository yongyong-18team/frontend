"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentType } from "react";
import { GuideIcon, HomeIcon, RecordIcon, SupportIcon, UserIcon, type IconProps } from "../icons/Icons";

type Tab = { href: string; label: string; Icon: ComponentType<IconProps> };

// 탭 라벨: PRD 3-1은 "돌봄 정보", Figma는 "돌봄 설명서" → 기획 문구 확정(D7) 때 맞춤
const TABS: Tab[] = [
  { href: "/diary", label: "돌봄 기록", Icon: RecordIcon },
  { href: "/manual", label: "돌봄 설명서", Icon: GuideIcon },
  { href: "/home", label: "홈", Icon: HomeIcon },
  { href: "/support", label: "돌봄 지원", Icon: SupportIcon },
  { href: "/settings", label: "마이페이지", Icon: UserIcon },
];

// GNB를 숨길 경로 (수신자 페이지 4.4, 로그인). 온보딩 경로가 생기면 추가
const HIDDEN_PREFIXES = ["/s/", "/login"];

/**
 * 하단 내비게이션 (높이 84, 화면 아래 고정)
 * 이 컴포넌트를 쓰는 화면은 내용이 가려지지 않게 본문에 pb-[100px] 정도 여백을 준다.
 */
export default function BottomNav() {
  const pathname = usePathname() ?? "";
  if (HIDDEN_PREFIXES.some((p) => pathname.startsWith(p))) return null;

  return (
    <nav
      aria-label="주요 메뉴"
      className="fixed inset-x-0 bottom-0 z-40 mx-auto flex h-[84px] max-w-[430px] border-t border-line-base bg-bg-surface px-2 pt-2.5 pb-5"
    >
      {TABS.map(({ href, label, Icon }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className="flex flex-1 flex-col items-center gap-1"
          >
            <span
              className={`flex h-8 w-[52px] items-center justify-center rounded-chip ${
                active ? "bg-primary-soft text-primary-strong" : "text-text-tertiary"
              }`}
            >
              <Icon size={22} />
            </span>
            <span className={`text-micro ${active ? "font-bold text-primary-strong" : "font-medium text-text-tertiary"}`}>
              {label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
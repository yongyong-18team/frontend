"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { GuideIcon, HomeIcon, RecordIcon, SupportIcon, UserIcon } from "@/components/icons/Icons";

/** 탭별로 "이 주소들에 있으면 이 탭을 강조" (Figma GNB 순서) */
const TABS = [
  { href: "/diary", label: "돌봄 기록", Icon: RecordIcon, match: ["/diary", "/report"] }, // 2.5 리포트 포함
  { href: "/manual", label: "돌봄 설명서", Icon: GuideIcon, match: ["/manual", "/share"] }, // 4.1~4.3 공유 포함
  { href: "/home", label: "홈", Icon: HomeIcon, match: ["/home"] },
  { href: "/support", label: "돌봄 지원", Icon: SupportIcon, match: ["/support", "/crisis"] }, // 5.5 위기 안내 포함
  { href: "/settings", label: "마이페이지", Icon: UserIcon, match: ["/settings"] },
];

/** 하단 탭을 숨길 주소 (4.4 수신자 페이지, 로그인, 온보딩) */
const HIDDEN_PREFIXES = ["/s/", "/login", "/onboarding"];

const isUnder = (path: string, base: string) => path === base || path.startsWith(`${base}/`);

/** Figma GNB: 높이 84, 아이콘 칸 52×32·모서리 16, 글자 12 */
export default function BottomNav() {
  const pathname = usePathname() ?? "";
  if (HIDDEN_PREFIXES.some((p) => pathname.startsWith(p))) return null;

  return (
    <nav
      aria-label="하단 메뉴"
      className="fixed bottom-0 left-1/2 z-30 flex h-[84px] w-full max-w-[430px] -translate-x-1/2 items-start border-t border-line-base bg-bg-surface px-2 pb-5 pt-2.5"
    >
      {TABS.map(({ href, label, Icon, match }) => {
        const active = match.some((m) => isUnder(pathname, m));
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className="flex min-w-0 flex-1 flex-col items-center gap-1"
          >
            <span
              className={`flex h-8 w-[52px] items-center justify-center rounded-[16px] ${
                active ? "bg-primary-soft text-primary-strong" : "text-text-tertiary"
              }`}
            >
              <Icon size={22} />
            </span>
            <span
              className={`whitespace-nowrap text-micro leading-[1.2] ${
                active ? "font-bold text-primary-strong" : "font-medium text-text-tertiary"
              }`}
            >
              {label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
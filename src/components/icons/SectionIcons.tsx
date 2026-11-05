import type { ReactNode } from "react";
import type { SectionCode } from "@/constants/labels";
import { BanIcon, BoltIcon, ChatIcon, PillIcon, StarIcon, SunIcon, type IconProps } from "./Icons";

/** 섹션 코드 → 아이콘 (Figma 3.1 기준: 건강 위험 요소·복약 모두 pill) */
const SECTION_ICON: Record<SectionCode, (p: IconProps) => ReactNode> = {
  PROHIBITED: BanIcon,
  HEALTH_RISK: PillIcon,
  COMMUNICATION: ChatIcon,
  BEHAVIOR_RESPONSE: BoltIcon,
  DAILY_LIFE: SunIcon,
  MEDICATION: PillIcon,
  PREFERENCE: StarIcon,
};

export type Tone = "primary" | "mint" | "peach" | "sky" | "pink";

/** 섹션별 색 (Figma 3.1 항목별 상세 목록) */
export const SECTION_TONE: Record<SectionCode, Tone> = {
  PROHIBITED: "peach",
  HEALTH_RISK: "peach",
  COMMUNICATION: "sky",
  BEHAVIOR_RESPONSE: "mint",
  DAILY_LIFE: "peach",
  MEDICATION: "pink",
  PREFERENCE: "primary",
};

/** tone → 연한 배경 + 진한 글자/아이콘 색 */
export const TONE_CLASS: Record<Tone, string> = {
  primary: "bg-primary-soft text-primary-strong",
  mint: "bg-mint-soft text-mint-strong",
  peach: "bg-peach-soft text-peach-strong",
  sky: "bg-sky-soft text-sky-strong",
  pink: "bg-pink-soft text-pink-strong",
};

/** 섹션 코드를 넣으면 맞는 아이콘을 그려줌 */
export function SectionIcon({ section, ...rest }: IconProps & { section: SectionCode }) {
  const Icon = SECTION_ICON[section];
  return <Icon {...rest} />;
}
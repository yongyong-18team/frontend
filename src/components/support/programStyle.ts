// src/components/support/programStyle.ts
// 지원 제도 종류(programType)별 아이콘·색 (Figma 5.4 기준). 5.4 목록과 5.3 상세가 같이 씀
import { BuildingIcon, ChatIcon, CoffeeIcon } from "@/components/icons/Icons";

export type ProgramTone = "mint" | "peach" | "sky";

export const PROGRAM_STYLE: Record<string, { Icon: typeof ChatIcon; tone: ProgramTone; description: string }> = {
  FAMILY_REST: { Icon: CoffeeIcon, tone: "peach", description: "보호자 휴식 지원" },
  PARENT_COUNSELING: { Icon: ChatIcon, tone: "mint", description: "전문 상담기관 안내" },
  EMERGENCY_CARE: { Icon: BuildingIcon, tone: "sky", description: "돌봄 공백 발생 시 연계" },
};

/** 위 목록에 없는 종류(주간활동·방과후활동 등)는 기본 제도 표시 */
export const DEFAULT_PROGRAM_STYLE = { Icon: ChatIcon, tone: "mint" as ProgramTone, description: "" };

export function programStyle(programType: string | null | undefined) {
  return (programType && PROGRAM_STYLE[programType]) || DEFAULT_PROGRAM_STYLE;
}

/** 아이콘 상자 배경·글자색 */
export const TONE_BOX: Record<ProgramTone, string> = {
  mint: "bg-mint-soft text-mint-strong",
  peach: "bg-peach-soft text-peach-strong",
  sky: "bg-sky-soft text-sky-strong",
};
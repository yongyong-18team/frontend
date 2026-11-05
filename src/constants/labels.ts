/** 설명서 섹션 코드 (API 명세 v1.4, 표시 순서 고정) */
export const SECTION_ORDER = [
  "PROHIBITED",
  "HEALTH_RISK",
  "COMMUNICATION",
  "BEHAVIOR_RESPONSE",
  "DAILY_LIFE",
  "MEDICATION",
  "PREFERENCE",
] as const;

export type SectionCode = (typeof SECTION_ORDER)[number];

export const SECTION_LABEL: Record<SectionCode, string> = {
  PROHIBITED: "절대 금지",
  HEALTH_RISK: "건강 위험 요소",
  COMMUNICATION: "의사소통 방법",
  BEHAVIOR_RESPONSE: "행동 특성 및 위기 대응",
  DAILY_LIFE: "하루 일과 및 생활 습관",
  MEDICATION: "복약 정보·주의사항",
  PREFERENCE: "선호·비선호",
};

/** 거주 지역 (구) */
export type District = "CHEOIN" | "GIHEUNG" | "SUJI";

export const DISTRICT_LABEL: Record<District, string> = {
  CHEOIN: "처인구",
  GIHEUNG: "기흥구",
  SUJI: "수지구",
};

/** 문서 유형 */
export type DocumentType = "GUIDE" | "DAILY" | "WEEKLY";

export const DOCUMENT_TYPE_LABEL: Record<DocumentType, string> = {
  GUIDE: "돌봄 설명서",
  DAILY: "일일 기록",
  WEEKLY: "주간 리포트",
};

/** 주간 리포트 공유 섹션 (API 명세 SHARE-01: WEEKLY) */
export const WEEKLY_SECTION_ORDER = ["WEEKLY_SUMMARY", "DAILY_TREND", "KEY_CHANGES"] as const;
export type WeeklySectionCode = (typeof WEEKLY_SECTION_ORDER)[number];

// TODO(D7 문구 확정): 주간 리포트 섹션 이름은 문서에 없어 임시로 붙임
export const WEEKLY_SECTION_LABEL: Record<WeeklySectionCode, string> = {
  WEEKLY_SUMMARY: "주간 요약",
  DAILY_TREND: "일별 기록 추이",
  KEY_CHANGES: "이번 주 새로 반영된 정보",
};

/** 공유에 쓰는 섹션 코드 전체 (설명서 7개 + 주간 3개) */
export type ShareSectionCode = SectionCode | WeeklySectionCode;

export const SHARE_SECTION_LABEL: Record<ShareSectionCode, string> = {
  ...SECTION_LABEL,
  ...WEEKLY_SECTION_LABEL,
};
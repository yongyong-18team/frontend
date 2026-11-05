import type { District, SectionCode } from "@/constants/labels";

/** GUIDE-01 응답 타입 (API 명세 v1.4) */
export type GuideEntry = {
  entryId: number;
  content: string;
  sourceType: "ONBOARDING" | "DIARY" | "MANUAL";
  updatedAt: string;
};

export type GuideSection = {
  section: SectionCode;
  entries: GuideEntry[];
};

export type GuideResponse = {
  basicInfo: {
    name: string;
    age: number;
    district: District;
    dong: string | null;
    emergencyContact: string | null;
  };
  updatedAt: string;
  sections: GuideSection[];
  editable: boolean;
};

/** 목업: API 명세 v1.4 예시 기준 (ONB-01 Q1~Q4, GUIDE-01·02 예시 문장) */
export const mockGuide: GuideResponse = {
  basicInfo: {
    name: "민지",
    age: 25,
    district: "SUJI",
    dong: "풍덕천동",
    emergencyContact: "어머니 010-0000-0000",
  },
  updatedAt: "2026-11-03T21:10:00+09:00",
  sections: [
    {
      section: "PROHIBITED",
      entries: [
        { entryId: 310, content: "갑자기 뒤에서 어깨를 잡지 않기", sourceType: "MANUAL", updatedAt: "2026-11-03T22:00:00+09:00" },
      ],
    },
    { section: "HEALTH_RISK", entries: [] },
    {
      section: "COMMUNICATION",
      entries: [
        { entryId: 304, content: "짧은 문장으로 천천히 말해 주세요", sourceType: "ONBOARDING", updatedAt: "2026-11-01T10:00:00+09:00" },
      ],
    },
    {
      section: "BEHAVIOR_RESPONSE",
      entries: [
        { entryId: 301, content: "공사 소음에 불안해함", sourceType: "DIARY", updatedAt: "2026-11-03T21:10:00+09:00" },
        { entryId: 303, content: "차에 태워 트로트를 틀어주면 진정돼요", sourceType: "ONBOARDING", updatedAt: "2026-11-01T10:00:00+09:00" },
      ],
    },
    {
      section: "DAILY_LIFE",
      entries: [
        { entryId: 302, content: "아침 7시에 일어나 8시에 주간활동센터에 가요", sourceType: "ONBOARDING", updatedAt: "2026-11-01T10:00:00+09:00" },
      ],
    },
    {
      section: "MEDICATION",
      entries: [
        { entryId: 305, content: "매운 음식을 못 먹고, 저녁 약은 식후 30분에 먹어요", sourceType: "ONBOARDING", updatedAt: "2026-11-01T10:00:00+09:00" },
      ],
    },
    { section: "PREFERENCE", entries: [] },
  ],
  editable: true,
};
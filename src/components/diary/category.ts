// src/components/diary/category.ts
// 추출 항목·설명서 섹션·시간대 표시 이름 (2.2 결과, 2.3 검토, 2.5 리포트에서 같이 사용)
// 섹션 이름은 Figma 3.1 돌봄 설명서 / 4.1 공유 범위 설정 기준

import type { DiaryItem, GuideSection, TimeSlot } from '@/lib/api/diary';

export type ChipTone = 'primary' | 'peach' | 'mint' | 'sky' | 'butter' | 'pink' | 'neutral';

/** 설명서 섹션 전체 이름 (PRD 3.1 순서) */
export const SECTION_LABEL: Record<GuideSection, string> = {
  PROHIBITED: '절대 금지',
  HEALTH_RISK: '건강 위험 요소',
  COMMUNICATION: '의사소통 방식',
  BEHAVIOR_RESPONSE: '행동 특성과 위기 대응',
  DAILY_LIFE: '하루 일과 및 생활 습관',
  MEDICATION: '복약 정보·주의 사항',
  PREFERENCE: '선호·비선호',
};

/** 칩에 쓰는 짧은 섹션 이름 */
const SECTION_CHIP: Record<GuideSection, { label: string; tone: ChipTone }> = {
  PROHIBITED: { label: '절대 금지', tone: 'pink' },
  HEALTH_RISK: { label: '건강', tone: 'pink' },
  COMMUNICATION: { label: '의사소통', tone: 'sky' },
  BEHAVIOR_RESPONSE: { label: '행동 특성', tone: 'peach' },
  DAILY_LIFE: { label: '생활 습관', tone: 'butter' },
  MEDICATION: { label: '복약', tone: 'sky' },
  PREFERENCE: { label: '선호·비선호', tone: 'butter' },
};

/**
 * 항목 분류(category) 칩. 행동 특성·대처 방법만 Figma에 있음
 * TODO(ERD v1.4): category 전체 목록을 받으면 이름·색 채우기. 모르는 값은 섹션 이름으로 표시
 */
const CATEGORY_CHIP: Record<string, { label: string; tone: ChipTone }> = {
  TRIGGER: { label: '상황·계기', tone: 'sky' },
  BEHAVIOR: { label: '행동 특성', tone: 'peach' },
  COPING: { label: '대처 방법', tone: 'mint' },
  PREFERENCE: { label: '선호·비선호', tone: 'butter' },
};

export function getItemChip(item: Pick<DiaryItem, 'category' | 'section'>) {
  return (
    CATEGORY_CHIP[item.category] ?? SECTION_CHIP[item.section] ?? { label: '기타', tone: 'neutral' as ChipTone }
  );
}

/** TODO(ERD v1.4): 시간대 전체 목록 확인 */
const TIME_SLOT_LABEL: Record<string, string> = {
  MORNING: '오전',
  AFTERNOON: '오후',
  EVENING: '저녁',
  NIGHT: '밤',
};

export function timeSlotLabel(slot: TimeSlot | null | undefined) {
  return slot ? (TIME_SLOT_LABEL[slot] ?? slot) : '';
}

// src/components/diary/category.ts
// 추출 정보 분류별 표시 이름과 칩 색 (2.2 결과, 2.3 검토에서 같이 사용)

import type { ExtractedCategory } from '@/lib/api/diary';

export type CategoryTone = 'peach' | 'mint' | 'sky' | 'pink' | 'neutral';

// 행동 특성·대처 방법만 Figma에 있음
export const CATEGORY: Record<ExtractedCategory, { label: string; tone: CategoryTone }> = {
  BEHAVIOR: { label: '행동 특성', tone: 'peach' },
  COPING: { label: '대처 방법', tone: 'mint' },
  PREFERENCE: { label: '선호', tone: 'sky' }, // TODO(디자인): 이름·색 확인
  HEALTH: { label: '건강', tone: 'pink' }, // TODO(디자인): 이름·색 확인
  ETC: { label: '기타', tone: 'neutral' },
};

export function getCategory(category: ExtractedCategory) {
  return CATEGORY[category] ?? CATEGORY.ETC;
}

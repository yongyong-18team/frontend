// src/hooks/useGuide.ts
// 3.1 설명서 (GUIDE-01), 3.2 편집 (GUIDE-01 + SUBJ-02) 불러오기 + 다시 시도

'use client';

import { useLoad } from '@/hooks/useLoad';
import { getGuide, getSubject, type GuideData, type SubjectData } from '@/lib/api/guide';

/** 3.1 설명서 */
export function useGuide() {
  return useLoad<GuideData>(getGuide);
}

/** 3.2 편집: 대상자 정보 + 설명서를 함께 */
export function useGuideEdit() {
  return useLoad<{ guide: GuideData; subject: SubjectData }>(async () => {
    const [guide, subject] = await Promise.all([getGuide(), getSubject()]);
    return { guide, subject };
  });
}
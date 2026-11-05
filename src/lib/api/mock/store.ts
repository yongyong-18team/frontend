// src/lib/api/mock/store.ts
// 백엔드가 준비되기 전까지 쓰는 "브라우저 안의 가짜 DB"
// - 사용자가 쓴 일기, 분석 결과, 검토 결과를 localStorage에 저장 → 새로고침해도 남음
// - 백엔드를 연결하면 이 폴더(mock)는 통째로 지우면 됩니다.
//
// 개발용 주소 (2.4 목록에서)
//   /diary?seed  → 저장된 일기가 없을 때 예시 일기 6개 넣기
//   /diary?reset → 저장된 일기 모두 지우기

import type { ExtractedItem, RiskLevel } from '@/lib/api/diary';

export type MockDiary = {
  id: string;
  /** YYYY-MM-DD */
  date: string;
  content: string;
  createdAt: number;
  riskLevel: RiskLevel;
  empathyMessage: string;
  /** detail(자세한 내용), reviewStatus(검토 결과)까지 함께 저장 */
  items: ExtractedItem[];
  /** 2.3에서 "반영하기"를 한 번이라도 했는지 */
  reviewed: boolean;
  /** 시험용: 분석 실패로 처리 */
  failed: boolean;
};

const STORAGE_KEY = 'yongyong-mock-diaries-v1';

let cache: Record<string, MockDiary> | null = null;

function canUseStorage() {
  return typeof window !== 'undefined';
}

function load(): Record<string, MockDiary> {
  if (cache) return cache;
  if (!canUseStorage()) return (cache = {});
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    cache = raw ? (JSON.parse(raw) as Record<string, MockDiary>) : {};
  } catch {
    cache = {};
  }
  return cache;
}

function persist() {
  if (!canUseStorage() || !cache) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
  } catch {
    /* 저장 공간이 없거나 막혀 있으면 이번 방문 동안만 메모리에 유지 */
  }
}

export const mockStore = {
  all(): MockDiary[] {
    return Object.values(load());
  },
  get(id: string): MockDiary | undefined {
    return load()[id];
  },
  put(diary: MockDiary) {
    load()[diary.id] = diary;
    persist();
  },
  update(id: string, change: (diary: MockDiary) => MockDiary) {
    const current = load()[id];
    if (!current) return;
    load()[id] = change(current);
    persist();
  },
  clear() {
    cache = {};
    persist();
  },
};

/** 분석 "진행 중"을 흉내 내기 위한 조회 횟수 (저장하지 않음) */
const pollCount = new Map<string, number>();
export function nextPollCount(id: string) {
  const n = (pollCount.get(id) ?? 0) + 1;
  pollCount.set(id, n);
  return n;
}

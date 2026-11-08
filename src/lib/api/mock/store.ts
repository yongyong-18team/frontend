// src/lib/api/mock/store.ts
// 백엔드가 준비되기 전까지 쓰는 "브라우저 안의 가짜 DB"
// - 일기·분석·검토 결과를 localStorage에 저장 → 새로고침해도 남음 (이 브라우저에만)
// - 응답 형식은 API 명세와 같고, 오류도 명세의 error.code로 던집니다.
// - 백엔드를 연결하면 이 폴더(mock)는 통째로 지우면 됩니다.

import { ApiError } from '@/lib/api/client';
import type {
  AnalyzeResult,
  CreateDiaryInput,
  CreateDiaryResult,
  DiaryDetail,
  DiaryItem,
  DiaryListPage,
  DiaryListQuery,
  InputType,
  ReviewDecision,
  ReviewResult,
  ReviewStatus,
  TimeSlot,
} from '@/lib/api/diary';
import type { WeeklyReport } from '@/lib/api/report';
import { analyzeContent } from '@/lib/api/mock/analyze';
import { addDays, fromDateKey, toDateKey } from '@/lib/date';

export const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

type MockDiary = {
  diaryId: number;
  diaryDate: string;
  content: string;
  inputType: InputType;
  createdAt: number;
  analysisStatus: 'PENDING' | 'DONE';
  empathyText: string | null;
  items: DiaryItem[];
};

type MockDb = {
  diaries: Record<string, MockDiary>;
  /** 설명서에 반영된 내용 (section|content) — 중복 반영 확인용 */
  guide: string[];
  nextGuideId: number;
};

const STORAGE_KEY = 'yongyong-mock-db-v2';
let cache: MockDb | null = null;

function emptyDb(): MockDb {
  return { diaries: {}, guide: [], nextGuideId: 301 };
}

function db(): MockDb {
  if (cache) return cache;
  if (typeof window === 'undefined') return (cache = emptyDb());
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    cache = raw ? (JSON.parse(raw) as MockDb) : emptyDb();
  } catch {
    cache = emptyDb();
  }
  return cache;
}

function save() {
  if (typeof window === 'undefined' || !cache) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
  } catch {
    /* 저장이 막혀 있으면 이번 방문 동안만 유지 */
  }
}

function find(diaryId: number): MockDiary {
  const diary = db().diaries[diaryId];
  if (!diary) throw new ApiError(404, 'COMMON_NOT_FOUND', '정보를 찾을 수 없어요.');
  return diary;
}

function reviewStatusOf(d: MockDiary): ReviewStatus {
  if (d.analysisStatus !== 'DONE') return 'NONE';
  return d.items.some((i) => i.status === 'PENDING') ? 'PENDING' : 'APPROVED';
}

/* ───────────── DIARY-01 ───────────── */

export function createDiary(input: CreateDiaryInput): CreateDiaryResult {
  const all = Object.values(db().diaries);
  const diaryId = all.length ? Math.max(...all.map((d) => d.diaryId)) + 1 : 501;
  db().diaries[diaryId] = {
    diaryId,
    diaryDate: input.diaryDate,
    content: input.content,
    inputType: input.inputType,
    createdAt: Date.now(),
    analysisStatus: 'PENDING',
    empathyText: null,
    items: [],
  };
  save();
  return { diaryId, analysisStatus: 'PENDING' };
}

/* ───────────── DIARY-02 ───────────── */

const analyzing = new Set<number>();

export async function analyzeDiary(diaryId: number): Promise<AnalyzeResult> {
  const diary = find(diaryId);
  if (analyzing.has(diaryId)) {
    throw new ApiError(409, 'DIARY_ALREADY_ANALYZING', '분석 중이에요. 잠시만 기다려 주세요.');
  }

  analyzing.add(diaryId);
  try {
    await delay(3000);
    const analysis = analyzeContent(diary.content);
    if (analysis.fail) {
      throw new ApiError(502, 'AI_TIMEOUT', '분석이 늦어지고 있어요. 기록은 저장됐으니 다시 시도해 주세요.');
    }
    diary.analysisStatus = 'DONE';
    diary.empathyText = analysis.empathyText;
    diary.items = analysis.items;
    save();
    return {
      analysisNo: 1,
      result: analysis.result,
      empathyText: analysis.empathyText,
      itemCount: analysis.items.length,
      items: analysis.items,
      burnoutNotice: analysis.burnoutNotice,
    };
  } finally {
    analyzing.delete(diaryId);
  }
}

/* ───────────── DIARY-03·04 ───────────── */

function hasDevParam(name: string) {
  return typeof window !== 'undefined' && new URLSearchParams(window.location.search).has(name);
}

export function listDiaries(query: DiaryListQuery): DiaryListPage {
  if (hasDevParam('reset')) {
    cache = emptyDb();
    save();
  }
  if (hasDevParam('seed') && Object.keys(db().diaries).length === 0) seed();

  const page = query.page ?? 0;
  const size = query.size ?? 20;
  const rows = Object.values(db().diaries)
    .filter((d) => (!query.from || d.diaryDate >= query.from) && (!query.to || d.diaryDate <= query.to))
    .sort((a, b) => (a.diaryDate === b.diaryDate ? b.createdAt - a.createdAt : b.diaryDate.localeCompare(a.diaryDate)));

  return {
    content: rows.slice(page * size, page * size + size).map((d) => ({
      diaryId: d.diaryId,
      diaryDate: d.diaryDate,
      preview: d.content.length > 40 ? `${d.content.slice(0, 40)}...` : d.content,
      analysisStatus: d.analysisStatus,
      reviewStatus: reviewStatusOf(d),
      pendingCount: d.items.filter((i) => i.status === 'PENDING').length,
      approvedCount: d.items.filter((i) => i.status === 'APPROVED').length,
    })),
    page,
    size,
    totalElements: rows.length,
  };
}

/* ───────────── DIARY-05 ───────────── */

export function deleteDiary(diaryId: number) {
  find(diaryId); // 없으면 404
  delete db().diaries[diaryId];
  save();
}

/* ───────────── HOME-01 중 일기 부분 ───────────── */

/** 오늘 기록 여부 + 최근 기록 3개 + 첫 기록부터 며칠째인지 (홈에서 사용) */
export function homeDiarySummary(today: string, limit = 3) {
  if (hasDevParam('seed') && Object.keys(db().diaries).length === 0) seed();
  const rows = Object.values(db().diaries).sort((a, b) =>
    a.diaryDate === b.diaryDate ? b.createdAt - a.createdAt : b.diaryDate.localeCompare(a.diaryDate),
  );
  const first = rows.at(-1);
  const daysTogether = first
    ? Math.floor((Date.parse(today) - Date.parse(first.diaryDate)) / 86_400_000) + 1
    : null;
  return {
    todayRecorded: rows.some((d) => d.diaryDate === today),
    daysTogether,
    recentActivities: rows.slice(0, limit).map((d) => ({
      diaryId: d.diaryId,
      diaryDate: d.diaryDate,
      preview: d.content.length > 40 ? `${d.content.slice(0, 40)}...` : d.content,
      approvedCount: d.items.filter((i) => i.status === 'APPROVED').length,
      pendingCount: d.items.filter((i) => i.status === 'PENDING').length,
      analyzed: d.analysisStatus === 'DONE',
    })),
  };
}

export function getDiaryDetail(diaryId: number): DiaryDetail {
  const d = find(diaryId);
  return {
    diaryId: d.diaryId,
    diaryDate: d.diaryDate,
    content: d.content,
    inputType: d.inputType,
    analysisStatus: d.analysisStatus,
    reviewStatus: reviewStatusOf(d),
    empathyText: d.empathyText,
    items: d.items,
  };
}

/* ───────────── ITEM-01 ───────────── */

export function reviewItems(diaryId: number, decisions: ReviewDecision[]): ReviewResult {
  const d = find(diaryId);
  // TODO(백엔드 A): 명세에 GUIDE_NOTHING_TO_APPLY 조건이 정확히 없음. 여기서는 "보낸 결정이 하나도 없을 때"로 가정
  if (decisions.length === 0) {
    throw new ApiError(400, 'GUIDE_NOTHING_TO_APPLY', '반영할 항목을 하나 이상 선택해 주세요.');
  }

  const result: ReviewResult = { approvedCount: 0, excludedCount: 0, duplicateSkippedCount: 0, createdGuideEntryIds: [] };
  const guide = db().guide;
  const removeFromGuide = (key: string) => {
    const at = guide.indexOf(key);
    if (at >= 0) guide.splice(at, 1);
  };

  for (const decision of decisions) {
    const item = d.items.find((i) => i.itemNo === decision.itemNo);
    if (!item) throw new ApiError(404, 'GUIDE_ITEM_NOT_FOUND', '항목을 찾을 수 없어요.');
    const oldKey = `${item.section}|${item.content}`;
    const wasApproved = item.status === 'APPROVED';

    if (decision.status === 'EXCLUDED') {
      // TODO(백엔드 A): 이미 반영한 항목을 제외하면 설명서에서도 빠지는지 확인. 가짜 서버는 뺌
      if (wasApproved) removeFromGuide(oldKey);
      item.status = 'EXCLUDED';
      result.excludedCount += 1;
      continue;
    }

    if (decision.content && decision.content !== item.content) {
      // TODO(백엔드 A): 이미 반영한 항목 문장을 고치면 설명서 항목도 고쳐지는지 확인. 가짜 서버는 바꿈
      if (wasApproved) removeFromGuide(oldKey);
      item.content = decision.content;
      item.edited = true;
    }
    item.status = 'APPROVED';
    result.approvedCount += 1;

    const key = `${item.section}|${item.content}`;
    if (guide.includes(key)) {
      if (!wasApproved || key !== oldKey) result.duplicateSkippedCount += 1;
    } else {
      guide.push(key);
      result.createdGuideEntryIds.push(db().nextGuideId++);
    }
  }
  save();
  return result;
}

/* ───────────── REPORT-03 ───────────── */

const SLOT_LABEL: Record<string, string> = { MORNING: '오전', AFTERNOON: '오후', EVENING: '저녁', NIGHT: '밤' };

export function weeklyReport(endDate?: string): WeeklyReport {
  const end = endDate ?? toDateKey(new Date());
  const days = Array.from({ length: 7 }, (_, i) => toDateKey(addDays(fromDateKey(end), i - 6)));
  const periodStart = days[0];

  const diaries = Object.values(db().diaries).filter((d) => d.diaryDate >= periodStart && d.diaryDate <= end);
  const approved = diaries.flatMap((d) =>
    d.items.filter((i) => i.status === 'APPROVED').map((i) => ({ ...i, diaryId: d.diaryId, diaryDate: d.diaryDate })),
  );
  const behaviors = approved.filter((i) => i.category === 'BEHAVIOR');
  const copings = approved.filter((i) => i.category === 'COPING');

  const countBy = <T,>(list: T[], key: (t: T) => string | null | undefined) => {
    const map = new Map<string, number>();
    for (const t of list) {
      const k = key(t);
      if (k) map.set(k, (map.get(k) ?? 0) + 1);
    }
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  };

  const repeatedBehaviors = countBy(behaviors, (b) => b.label ?? b.content).map(([label, count]) => ({ label, count }));
  const timePattern = countBy(behaviors, (b) => b.timeSlot).map(([timeSlot, count]) => ({
    timeSlot: timeSlot as TimeSlot,
    count,
  }));

  // 3건 미만이면 빈 배열. 원인을 설명하는 문장은 넣지 않음 (명세)
  const summaryLines: string[] = [];
  if (diaries.length >= 3) {
    if (repeatedBehaviors[0]) {
      summaryLines.push(`'${repeatedBehaviors[0].label}' 행동이 ${repeatedBehaviors[0].count}번 기록됐어요.`);
    }
    const parts: string[] = [];
    if (timePattern[0]) parts.push(`주로 ${SLOT_LABEL[timePattern[0].timeSlot] ?? timePattern[0].timeSlot}에 있었고`);
    if (copings.length) parts.push(`대처 기록이 ${copings.length}번 있었어요.`);
    if (parts.length) summaryLines.push(parts.join(', ').replace(/고$/, '어요.'));
  }

  return {
    periodStart,
    periodEnd: end,
    recordCount: diaries.length,
    behaviorCount: behaviors.length,
    summaryLines,
    dailyTrend: days.map((date) => ({
      date,
      recordCount: diaries.filter((d) => d.diaryDate === date).length,
      behaviorCount: behaviors.filter((b) => b.diaryDate === date).length,
    })),
    keyChanges: approved
      .filter((i) => i.category !== 'TRIGGER')
      .sort((a, b) => b.diaryDate.localeCompare(a.diaryDate))
      .slice(0, 5)
      .map((i) => ({ diaryId: i.diaryId, diaryDate: i.diaryDate, section: i.section, content: i.content })),
    repeatedBehaviors,
    timePattern,
  };
}

/* ───────────── 개발용 예시 (/diary?seed) ───────────── */

function seed() {
  const samples: { daysAgo: number; approve: boolean; content: string }[] = [
    { daysAgo: 1, approve: true, content: '오후 마트에서 큰 소리가 나자 귀를 막고 소리를 질렀어요. 이어폰으로 좋아하는 동요를 틀어주니 10분쯤 지나 진정했어요.' },
    { daysAgo: 2, approve: true, content: '오후에 산책 시간이 바뀌자 현관에서 신발 신기를 거부했어요. 저녁 식사량이 평소보다 줄었어요.' },
    { daysAgo: 3, approve: false, content: '오후에 피로해 보여서 낮잠을 1시간 잤어요. 깨고 나서 짜증을 냈어요.' },
    { daysAgo: 4, approve: true, content: '아침에 약을 먹고 컨디션이 좋았어요. 오후에 공사 소리가 나자 소리를 질렀어요. 안아주니 차분해졌어요.' },
    { daysAgo: 20, approve: true, content: '새 치료실 첫날이라 들어가기 전에 울었어요. 선생님이 안아주니 차분해졌어요.' },
    { daysAgo: 35, approve: true, content: '채소를 한 입 먹었어요. 칭찬해 주니 좋아했어요.' },
  ];
  samples.forEach((s, i) => {
    const diaryId = 501 + i;
    const analysis = analyzeContent(s.content);
    db().diaries[diaryId] = {
      diaryId,
      diaryDate: toDateKey(addDays(new Date(), -s.daysAgo)),
      content: s.content,
      inputType: 'TEXT',
      createdAt: Date.now() - s.daysAgo * 86_400_000,
      analysisStatus: 'DONE',
      empathyText: analysis.empathyText,
      items: analysis.items.map((it) => ({ ...it, status: s.approve ? 'APPROVED' : 'PENDING' })),
    };
  });
  save();
}

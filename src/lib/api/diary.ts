// src/lib/api/diary.ts
// 일기·분석 API (백엔드 B)
//
// 지금은 백엔드가 준비되지 않아 "브라우저 안의 가짜 DB"(mock 폴더)로 동작합니다.
// - 2.1에서 쓴 일기가 저장되고, 그 내용에 따라 2.2 분석 → 2.3 검토 → 2.4 목록 → 2.5 리포트가 바뀝니다.
// - 백엔드 연결 시: 각 함수의 "가짜 응답" 부분을 지우고 주석 처리된 실제 요청을 살린 뒤, mock 폴더를 지우면 됩니다.
//   화면 코드는 고칠 필요가 없습니다.
//
// 개발용 주소
//   /diary?seed   예시 일기 6개 넣기 (저장된 일기가 없을 때)
//   /diary?reset  저장된 일기 모두 지우기
//   /diary?empty  저장된 것과 상관없이 "기록 없음" 화면 보기
//   /diary/mock-crisis/result, mock-fail, mock-empty, mock-아무거나 → 예전 시험용 화면

// import { api } from '@/lib/api/client';
import { analyzeDiary } from '@/lib/api/mock/analyze';
import { mockStore, nextPollCount, type MockDiary } from '@/lib/api/mock/store';
import { addDays, startOfWeek, toDateKey } from '@/lib/date';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/* ───────────── 타입 ───────────── */

export type AnalysisStatus = 'PROCESSING' | 'DONE' | 'FAILED';
export type RiskLevel = 'NONE' | 'CRISIS';
/** TODO(백엔드 B): 실제 분류 목록 확인 */
export type ExtractedCategory = 'BEHAVIOR' | 'COPING' | 'PREFERENCE' | 'HEALTH' | 'ETC';

export type ExtractedItem = {
  id: string;
  category: ExtractedCategory;
  /** 한 줄 요약 (예: 갑작스러운 큰 소리에 불안 반응) */
  summary: string;
  /** 근거가 된 일기 원문 */
  quote: string;
  /** 사용자가 직접 쓴 자세한 내용. 없으면 화면에서 quote를 대신 보여줌 */
  detail?: string;
  /** 지난번 2.3에서 고른 결과. 아직 검토 안 했으면 없음 */
  reviewStatus?: 'APPROVED' | 'EXCLUDED';
};

/** 화면에 보여줄 자세한 내용: 사용자가 쓴 내용이 있으면 그것, 없으면 일기 원문 */
export function getItemDetail(item: Pick<ExtractedItem, 'detail' | 'quote'>) {
  return item.detail?.trim() ? item.detail : item.quote;
}

export type DiaryAnalysis = {
  diaryId: string;
  status: AnalysisStatus;
  riskLevel: RiskLevel;
  /** "오늘의 한마디" 공감 문구 */
  empathyMessage: string;
  items: ExtractedItem[];
};

export type ReviewDecision = {
  itemId: string;
  status: 'APPROVED' | 'EXCLUDED';
  /** 자세한 내용 (2.2·2.3 팝업에서 사용자가 쓴 내용, 없으면 일기 원문) */
  detail: string;
};

/** TODO(백엔드 B): 분석 중·분석 실패 상태도 목록에 오는지 확인 */
export type DiaryListStatus = 'APPROVED' | 'PENDING_REVIEW';

export type DiaryListItem = {
  diaryId: string;
  /** YYYY-MM-DD */
  date: string;
  status: DiaryListStatus;
  /** 목록에 보이는 한 줄 요약 (예: 큰 소리에 불안 반응 · 음악으로 안정) */
  summary: string;
};

export type WeeklyReportBanner = {
  available: boolean;
  /** 리포트 기간 시작일 YYYY-MM-DD (2.5로 넘김) */
  periodStart?: string;
};

/* ───────────── 2.1 작성 ───────────── */

/**
 * 녹음 파일 → 텍스트 변환(STT)
 * TODO(백엔드 B): STT를 서버에서 하는지, 주소, 파일 필드 이름, 허용 형식(webm/mp4)·용량, 응답 형식
 */
export async function transcribeAudio(audio: Blob): Promise<{ text: string }> {
  // const form = new FormData();
  // const ext = audio.type.includes('mp4') ? 'mp4' : 'webm';
  // form.append('audio', audio, `diary.${ext}`);
  // return api.post<{ text: string }>('/diaries/stt', form);

  // ── 가짜 응답: 서버 없이는 음성을 글로 바꿀 수 없어 예시 문장을 돌려줌 ──
  void audio;
  await delay(1500);
  return {
    text: '오늘 오후 마트에서 큰 소리가 나자 민준이가 귀를 막고 소리를 질렀어요. 이어폰으로 좋아하는 동요를 틀어주니 10분쯤 지나 진정했어요.',
  };
}

/**
 * 일기 저장 + AI 분석 요청
 * TODO(백엔드 B): 주소, 요청 필드(날짜·본문·녹음 파일 포함 여부), 응답의 일기 ID 필드 이름
 */
export async function requestDiaryAnalysis(input: {
  content: string;
  audio?: Blob | null;
}): Promise<{ diaryId: string }> {
  // return api.post<{ diaryId: string }>('/diaries', { content: input.content });

  // ── 가짜 응답: 입력한 내용을 저장하고 바로 분석해 둠 (화면에는 몇 초 "분석 중"으로 보임) ──
  await delay(800);
  const id = `d-${Date.now()}`;
  mockStore.put(createMockDiary(id, toDateKey(new Date()), input.content));
  return { diaryId: id };
}

/* ───────────── 2.2 분석 결과 ───────────── */

/**
 * 분석 결과 조회. 화면은 status가 DONE/FAILED가 될 때까지 반복 조회합니다.
 * TODO(백엔드 B): 주소, 응답 형식, 분석이 비동기인지(폴링) 아니면 요청 응답에 바로 오는지,
 *                 위기 판단 값(riskLevel) 이름, 이미 검토한 기록이면 항목별 검토 결과(reviewStatus)도 주는지
 */
export async function getDiaryAnalysis(diaryId: string): Promise<DiaryAnalysis> {
  // return api.get<DiaryAnalysis>(`/diaries/${diaryId}/analysis`);

  // ── 가짜 응답 ──
  await delay(400);
  const firstTwoPolls = nextPollCount(diaryId) < 3; // 처음 두 번은 "분석 중"

  const diary = mockStore.get(diaryId);
  if (!diary) return legacyTestAnalysis(diaryId, firstTwoPolls);

  if (firstTwoPolls) return { ...toAnalysis(diary), status: 'PROCESSING' };
  return toAnalysis(diary);
}

/**
 * 추출 항목의 자세한 내용 저장 (2.2 팝업)
 * TODO(백엔드 B): 주소, 필드 이름(detail?), 2.3 반영 전에 따로 저장하는 API가 있는지
 */
export async function updateItemDetail(diaryId: string, itemId: string, detail: string): Promise<void> {
  // return api.patch<void>(`/diaries/${diaryId}/items/${itemId}`, { detail });

  // ── 가짜 응답 ──
  await delay(400);
  mockStore.update(diaryId, (d) => ({
    ...d,
    items: d.items.map((item) => (item.id === itemId ? { ...item, detail } : item)),
  }));
}

/* ───────────── 2.3 검토·승인 ───────────── */

/**
 * 검토 결과를 보내 승인한 항목을 돌봄 설명서에 반영
 * TODO(백엔드 B / 백엔드 A 설명서): 주소, 검토 대기 항목도 보내야 하는지, 응답 형식, 다시 반영하면 덮어쓰는지
 */
export async function submitDiaryReview(diaryId: string, decisions: ReviewDecision[]): Promise<void> {
  // return api.post<void>(`/diaries/${diaryId}/review`, { decisions });

  // ── 가짜 응답 ──
  await delay(800);
  const byId = new Map(decisions.map((d) => [d.itemId, d]));
  mockStore.update(diaryId, (d) => ({
    ...d,
    reviewed: true,
    items: d.items.map((item) => {
      const decision = byId.get(item.id);
      return decision ? { ...item, reviewStatus: decision.status, detail: decision.detail } : item;
    }),
  }));
}

/* ───────────── 2.4 기록 목록 ───────────── */

/**
 * 내 기록 목록 (최신순)
 * TODO(백엔드 B): 주소, 기간 필터를 서버에서 하는지(쿼리) 프론트에서 하는지, 페이지 나누기(무한 스크롤) 여부
 */
export async function getDiaryList(): Promise<DiaryListItem[]> {
  // return api.get<DiaryListItem[]>('/diaries');

  // ── 가짜 응답 ──
  await delay(500);
  handleDevParams();
  if (hasDevParam('empty')) return [];

  return mockStore
    .all()
    .filter((d) => !d.failed && d.riskLevel !== 'CRISIS')
    .sort((a, b) => (a.date === b.date ? b.createdAt - a.createdAt : b.date.localeCompare(a.date)))
    .map((d) => ({
      diaryId: d.id,
      date: d.date,
      status: d.reviewed ? 'APPROVED' : 'PENDING_REVIEW',
      summary: listSummary(d),
    }));
}

/**
 * 이번 주 리포트 배너 표시 여부
 * TODO(백엔드 B): 주간 리포트가 준비됐는지 알려주는 API
 */
export async function getWeeklyReportBanner(): Promise<WeeklyReportBanner> {
  // return api.get<WeeklyReportBanner>('/reports/weekly/latest');

  // ── 가짜 응답: 이번 주에 쓴 일기가 하나라도 있으면 배너 표시 ──
  await delay(300);
  if (hasDevParam('empty')) return { available: false };
  const weekStart = toDateKey(startOfWeek(new Date()));
  const weekEnd = toDateKey(addDays(startOfWeek(new Date()), 7));
  const hasThisWeek = mockStore.all().some((d) => d.date >= weekStart && d.date < weekEnd && !d.failed);
  return hasThisWeek ? { available: true, periodStart: weekStart } : { available: false };
}

/* ───────────── 가짜 응답 도우미 ───────────── */

function createMockDiary(id: string, date: string, content: string): MockDiary {
  const analysis = analyzeDiary(content, id);
  return {
    id,
    date,
    content,
    createdAt: Date.now(),
    riskLevel: analysis.riskLevel,
    empathyMessage: analysis.empathyMessage,
    items: analysis.items,
    reviewed: false,
    failed: analysis.failed,
  };
}

function toAnalysis(d: MockDiary): DiaryAnalysis {
  if (d.failed) {
    return { diaryId: d.id, status: 'FAILED', riskLevel: 'NONE', empathyMessage: '', items: [] };
  }
  return { diaryId: d.id, status: 'DONE', riskLevel: d.riskLevel, empathyMessage: d.empathyMessage, items: d.items };
}

/** 목록 한 줄: 제외하지 않은 항목 요약 2개, 없으면 본문 앞부분 */
function listSummary(d: MockDiary) {
  const parts = d.items.filter((i) => i.reviewStatus !== 'EXCLUDED').map((i) => i.summary);
  if (parts.length > 0) return parts.slice(0, 2).join(' · ');
  const text = d.content.replace(/\s+/g, ' ').trim();
  return text.length > 30 ? `${text.slice(0, 30)}…` : text;
}

function hasDevParam(name: string) {
  return typeof window !== 'undefined' && new URLSearchParams(window.location.search).has(name);
}

function handleDevParams() {
  if (hasDevParam('reset')) mockStore.clear();
  if (hasDevParam('seed') && mockStore.all().length === 0) seedSampleDiaries();
}

/** /diary?seed — Figma와 비슷한 예시 일기 */
function seedSampleDiaries() {
  const samples: { daysAgo: number; content: string; reviewed: boolean }[] = [
    {
      daysAgo: 1,
      reviewed: true,
      content: '오후 마트에서 큰 소리가 나자 귀를 막고 소리를 질렀어요. 이어폰으로 좋아하는 동요를 틀어주니 10분쯤 지나 진정했어요.',
    },
    {
      daysAgo: 2,
      reviewed: true,
      content: '산책 시간이 바뀌어서 그런지 현관에서 신발 신기를 거부했어요. 저녁 식사량이 평소보다 줄었어요.',
    },
    { daysAgo: 3, reviewed: false, content: '오후에 피로해 보여서 낮잠을 1시간 잤어요. 깨고 나서 짜증을 냈어요.' },
    { daysAgo: 4, reviewed: true, content: '아침에 약을 먹고 컨디션이 좋았어요. 좋아하는 블록 놀이를 오래 했어요.' },
    {
      daysAgo: 20,
      reviewed: true,
      content: '새 치료실 첫날이라 들어가기 전에 울었어요. 선생님이 안아주니 차분해졌어요.',
    },
    { daysAgo: 35, reviewed: true, content: '채소를 한 입 먹었어요. 칭찬해 주니 좋아했어요.' },
  ];

  samples.forEach((s, i) => {
    const id = `seed-${i + 1}`;
    const diary = createMockDiary(id, toDateKey(addDays(new Date(), -s.daysAgo)), s.content);
    mockStore.put({
      ...diary,
      createdAt: Date.now() - s.daysAgo * 86_400_000,
      reviewed: s.reviewed,
      items: s.reviewed ? diary.items.map((it) => ({ ...it, reviewStatus: 'APPROVED' as const })) : diary.items,
    });
  });
}

/** 저장소에 없는 주소(예전 시험용 /diary/mock-…/result)는 고정된 예시로 응답 */
function legacyTestAnalysis(diaryId: string, processing: boolean): DiaryAnalysis {
  const base: DiaryAnalysis = {
    diaryId,
    status: processing ? 'PROCESSING' : 'DONE',
    riskLevel: 'NONE',
    empathyMessage: '오늘도 세심하게 살펴보셨네요.\n작은 변화도 소중한 돌봄 정보가 돼요.',
    items: [],
  };
  if (processing) return base;
  if (diaryId.includes('fail')) return { ...base, status: 'FAILED' };
  if (diaryId.includes('crisis')) return { ...base, riskLevel: 'CRISIS' };
  if (diaryId.includes('empty')) return base;
  return {
    ...base,
    items: [
      {
        id: 'item-1',
        category: 'BEHAVIOR',
        summary: '갑작스러운 큰 소리에 불안 반응',
        quote: '마트에서 큰 소리가 나자 귀를 막고 소리를 질렀어요.',
      },
      {
        id: 'item-2',
        category: 'COPING',
        summary: '좋아하는 동요를 들려주면 10분 내 안정',
        quote: '이어폰으로 좋아하는 동요를 틀어주니 10분쯤 지나 진정했어요.',
      },
    ],
  };
}

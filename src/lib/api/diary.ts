// src/lib/api/diary.ts
// 일기·AI 분석·검토 API (API 명세 2-4, 백엔드 B / ITEM-01은 백엔드 A)
//
// 지금은 백엔드 연결 전이라 "브라우저 안의 가짜 DB"(mock 폴더)로 동작합니다.
// 응답 형식은 명세와 똑같이 맞춰 두었습니다.
// 백엔드 연결 시: 각 함수의 "가짜 응답" 부분을 지우고 주석 처리된 실제 요청을 살린 뒤, mock 폴더를 지우면 됩니다.
//
// 개발용 주소 (2.4 목록)
//   /diary?seed   예시 일기 넣기 (저장된 일기가 없을 때)
//   /diary?reset  저장된 일기 모두 지우기
// 개발용 일기 내용
//   "죽고 싶다", "자해" 등 → CRISIS(5.5로 이동) / "#실패" → AI_TIMEOUT / "지쳐", "힘들어" → 소진 지원 카드

import { ApiError, api, subjectPath } from '@/lib/api/client';
import * as mock from '@/lib/api/mock/store';

void api;
void subjectPath;

/* ───────────── 타입 (명세 그대로) ───────────── */

export type InputType = 'VOICE' | 'TEXT';
/** TODO(ERD v1.4): 분석 상태 전체 목록 확인. 명세에는 PENDING·DONE만 나옴 */
export type AnalysisStatus = 'PENDING' | 'DONE' | (string & {});
/** 2.4 목록 상태 (계산값): 분석 전 NONE, 검토할 항목이 남으면 PENDING, 없으면 APPROVED */
export type ReviewStatus = 'NONE' | 'PENDING' | 'APPROVED';
export type ItemStatus = 'PENDING' | 'APPROVED' | 'EXCLUDED';
export type AnalyzeResultType = 'REVIEW' | 'NO_ITEMS' | 'CRISIS';

/** 설명서 섹션 (GUIDE-03 기준 7개) */
export type GuideSection =
  | 'PROHIBITED'
  | 'HEALTH_RISK'
  | 'COMMUNICATION'
  | 'BEHAVIOR_RESPONSE'
  | 'DAILY_LIFE'
  | 'MEDICATION'
  | 'PREFERENCE';

/** TODO(ERD v1.4): 추출 항목 분류 전체 목록. 명세 예시는 TRIGGER·BEHAVIOR */
export type ItemCategory = 'TRIGGER' | 'BEHAVIOR' | 'COPING' | 'HEALTH' | 'PREFERENCE' | (string & {});
/** TODO(ERD v1.4): 시간대 전체 목록. 명세 예시는 AFTERNOON·EVENING */
export type TimeSlot = 'MORNING' | 'AFTERNOON' | 'EVENING' | 'NIGHT' | (string & {});

export type DiaryItem = {
  itemNo: number;
  category: ItemCategory;
  section: GuideSection;
  /** 행동 이름 (예: 소리 지름). 없으면 null */
  label?: string | null;
  /** 항목 문장. 2.3에서 고칠 수 있음 */
  content: string;
  timeSlot?: TimeSlot | null;
  durationMin?: number | null;
  episodeNo?: number | null;
  /** 근거가 된 일기 원문 (고치지 않음, 공유되지 않음) */
  evidenceQuote: string;
  status: ItemStatus;
  /** 수정 후 승인했는지 (DIARY-04) */
  edited?: boolean;
};

/** DIARY-01 요청·응답 */
export type CreateDiaryInput = { diaryDate: string; content: string; inputType: InputType };
export type CreateDiaryResult = { diaryId: number; analysisStatus: AnalysisStatus };

/** DIARY-02 응답 */
export type AnalyzeResult = {
  analysisNo: number;
  result: AnalyzeResultType;
  empathyText: string | null;
  itemCount: number;
  items: DiaryItem[];
  /** true면 2.2 하단에 소진 지원 안내 카드 → 5.4 */
  burnoutNotice: boolean;
};

/** DIARY-04 응답 */
export type DiaryDetail = {
  diaryId: number;
  diaryDate: string;
  content: string;
  inputType: InputType;
  analysisStatus: AnalysisStatus;
  reviewStatus: ReviewStatus;
  /** 위기 판정 일기는 null (위기 여부 자체는 내려주지 않음) */
  empathyText: string | null;
  items: DiaryItem[];
};

/** DIARY-03 목록 한 줄 */
export type DiaryListItem = {
  diaryId: number;
  diaryDate: string;
  /** 일기 원문 앞부분 */
  preview: string;
  analysisStatus: AnalysisStatus;
  reviewStatus: ReviewStatus;
  pendingCount: number;
  approvedCount: number;
};

export type DiaryListPage = {
  content: DiaryListItem[];
  page: number;
  size: number;
  totalElements: number;
};

export type DiaryListQuery = { from?: string; to?: string; page?: number; size?: number };

/** ITEM-01 요청·응답 */
export type ReviewDecision = {
  itemNo: number;
  status: 'APPROVED' | 'EXCLUDED';
  /** 있으면 수정 후 승인(edited=true) */
  content?: string;
};
export type ReviewResult = {
  approvedCount: number;
  excludedCount: number;
  /** 설명서에 같은 내용이 이미 있어 건너뛴 수 */
  duplicateSkippedCount: number;
  createdGuideEntryIds: number[];
};

/* ───────────── 시간 제한 ───────────── */

/** STT-01: 서버 20초 이내 */
const STT_TIMEOUT_MS = 30_000;
/** DIARY-02: 클라이언트 타임아웃 30초 이상 (서버 상한 25초) */
const ANALYZE_TIMEOUT_MS = 35_000;

/** STT-01 제한: 3분, 10MB */
export const STT_MAX_SECONDS = 180;
export const STT_MAX_BYTES = 10 * 1024 * 1024;

/* ───────────── API ───────────── */

/** STT-01 음성 → 텍스트 (음성은 저장되지 않음) */
export async function transcribeAudio(audio: Blob): Promise<{ text: string }> {
  // const form = new FormData();
  // const ext = audio.type.includes('mp4') || audio.type.includes('m4a') ? 'm4a' : 'webm';
  // form.append('audio', audio, `diary.${ext}`);
  // return api.post<{ text: string }>('/stt', form, { timeoutMs: STT_TIMEOUT_MS });

  // ── 가짜 응답: 서버 없이는 음성을 글로 바꿀 수 없어 고정 문장 (명세의 AI_MODE=mock과 같음) ──
  void STT_TIMEOUT_MS;
  if (audio.size > STT_MAX_BYTES) {
    throw new ApiError(413, 'STT_FILE_TOO_LARGE', '녹음이 너무 길어요. 3분 이내로 나눠서 녹음해 주세요.');
  }
  await mock.delay(1500);
  return {
    text: '오늘 오후 마트에서 큰 소리가 나자 민준이가 귀를 막고 소리를 질렀어요. 이어폰으로 좋아하는 동요를 틀어주니 10분쯤 지나 진정했어요.',
  };
}

/** DIARY-01 일기 저장 */
export async function createDiary(input: CreateDiaryInput): Promise<CreateDiaryResult> {
  // return api.post<CreateDiaryResult>(subjectPath('/diaries'), input);

  // ── 가짜 응답 ──
  await mock.delay(600);
  if (!input.content.trim()) throw new ApiError(400, 'DIARY_EMPTY_CONTENT', '내용을 입력해 주세요.');
  return mock.createDiary(input);
}

/** DIARY-02 AI 분석 (동기, 최대 25초) */
export async function analyzeDiary(diaryId: number): Promise<AnalyzeResult> {
  // return api.post<AnalyzeResult>(subjectPath(`/diaries/${diaryId}/analyze`), undefined, {
  //   timeoutMs: ANALYZE_TIMEOUT_MS,
  // });

  // ── 가짜 응답 (분석 3초 흉내) ──
  void ANALYZE_TIMEOUT_MS;
  return mock.analyzeDiary(diaryId);
}

/** DIARY-03 일기 목록 (기간 필터는 from/to) */
export async function getDiaryList(query: DiaryListQuery = {}): Promise<DiaryListPage> {
  // return api.get<DiaryListPage>(subjectPath('/diaries'), { query });

  // ── 가짜 응답 ──
  await mock.delay(500);
  return mock.listDiaries(query);
}

/** DIARY-04 일기 상세 (원문, 공감, 추출 항목) */
export async function getDiaryDetail(diaryId: number): Promise<DiaryDetail> {
  // return api.get<DiaryDetail>(subjectPath(`/diaries/${diaryId}`));

  // ── 가짜 응답 ──
  await mock.delay(400);
  return mock.getDiaryDetail(diaryId);
}

/** ITEM-01 검토·반영: 승인(수정 포함)한 항목을 설명서에 반영 */
export async function reviewDiaryItems(diaryId: number, decisions: ReviewDecision[]): Promise<ReviewResult> {
  // return api.post<ReviewResult>(subjectPath(`/diaries/${diaryId}/items/review`), { decisions });

  // ── 가짜 응답 ──
  await mock.delay(800);
  return mock.reviewItems(diaryId, decisions);
}

/** DIARY-05 일기 삭제 (연결된 분석·추출 데이터도 함께 삭제) */
export async function deleteDiary(diaryId: number): Promise<void> {
  // return api.delete<void>(subjectPath(`/diaries/${diaryId}`));

  // ── 가짜 응답 ──
  await mock.delay(500);
  mock.deleteDiary(diaryId);
}

// src/lib/api/share.ts
// 공유 API (API 명세 2-7 SHARE-01~05, PUB-01, 백엔드 A)
//
// 지금은 가짜 응답으로 동작합니다. 설명서 내용은 lib/api/guide.ts의 가짜 DB를 같이 써서
// 3.2에서 고친 내용이 4.1·4.2에도 보입니다.
// 백엔드 연결 시: 각 함수의 "가짜 응답" 부분을 지우고 주석 처리된 실제 요청을 살리면 됩니다.

import { ApiError, api, subjectPath } from '@/lib/api/client';
import * as mock from '@/lib/api/mock/store';
import { getGuide } from '@/lib/api/guide';
import {
  SECTION_ORDER,
  WEEKLY_SECTION_ORDER,
  type DocumentType,
  type ShareSectionCode,
} from '@/constants/labels';
import { mockPublicShare, mockShareHistory } from '@/mocks/share';

void api;
void subjectPath;

/* ───────────── 타입 (명세 그대로) ───────────── */

/** SHARE-01 응답 */
export type SectionOptionsResponse = {
  documentType: DocumentType;
  options: { sectionCode: ShareSectionCode; defaultOn: boolean; hasContent: boolean }[];
  emergencyContact: { available: boolean; defaultOn: boolean };
};

/** SHARE-01 조건 */
export type SectionOptionsQuery = {
  documentType: DocumentType;
  sourceDiaryId: number | null;
  periodStart: string | null;
};

/** SHARE-02 요청 */
export type ShareDraftRequest = {
  documentType: DocumentType;
  sourceDiaryId: number | null;
  periodStart: string | null;
  sectionCodes: ShareSectionCode[];
  showEmergencyContact: boolean;
  recipientLabel: string | null;
};

/** SHARE-02 preview (= 고정본, PUB-01 content와 같은 모양) */
export type SharePreview = {
  basicInfo: { name: string; age: number; emergencyContact?: string };
  documentType: DocumentType;
  summaryLines: string[];
  sections: { section: ShareSectionCode; entries: string[] }[];
};

/** SHARE-02 응답 */
export type ShareDraftResponse = { shareId: number; preview: SharePreview; validDays: number };

/** SHARE-03 응답 (shareUrl은 이 응답에서만) */
export type ShareApproveResponse = {
  shareId: number;
  shareUrl: string;
  documentType: DocumentType;
  approvedAt: string;
  expiresAt: string;
  notice: string;
};

/** DRAFT는 명세상 내역에 안 나오지만 Swagger enum에 있어 함께 둠 (4.3 내역에서 걸러냄) */
export type ShareStatus = 'DRAFT' | 'ACTIVE' | 'EXPIRED' | 'REVOKED';
export type ShareHistoryItem = {
  shareId: number;
  documentType: DocumentType;
  recipientLabel: string | null;
  createdByName: string;
  approvedAt: string;
  expiresAt: string;
  status: ShareStatus;
  revocable: boolean;
};

/** PUB-01 응답 */
export type PublicShareResponse = {
  documentType: DocumentType;
  sharedAt: string;
  expiresAt: string;
  content: Omit<SharePreview, 'documentType'>;
};

/* ───────────── 가짜 DB (백엔드 연결 시 삭제) ───────────── */

let historyDb: ShareHistoryItem[] = structuredClone(mockShareHistory) as ShareHistoryItem[];
let nextShareId = 950;
/** 승인 전 초안 (shareId → 문서 유형·받는 사람) */
const draftDb = new Map<number, { documentType: DocumentType; recipientLabel: string | null }>();

/** "2026-11-05T21:30:00+09:00" 모양 */
function toKstIso(ms: number) {
  return new Date(ms + 9 * 60 * 60 * 1000).toISOString().slice(0, 19) + '+09:00';
}

/* ───────────── API ───────────── */

/** SHARE-01 문서 유형별 공개 가능 섹션 */
export async function getSectionOptions(q: SectionOptionsQuery): Promise<SectionOptionsResponse> {
  // return api.get<SectionOptionsResponse>(subjectPath('/shares/section-options'), { query: q });

  // ── 가짜 응답 ──
  const guide = await getGuide();
  const emergencyContact = { available: !!guide.basicInfo.emergencyContact, defaultOn: false };
  if (q.documentType === 'WEEKLY') {
    return {
      documentType: 'WEEKLY',
      options: WEEKLY_SECTION_ORDER.map((sectionCode) => ({ sectionCode, defaultOn: true, hasContent: true })),
      emergencyContact,
    };
  }
  return {
    documentType: q.documentType,
    options: SECTION_ORDER.map((sectionCode) => {
      const hasContent = (guide.sections.find((s) => s.section === sectionCode)?.entries.length ?? 0) > 0;
      return { sectionCode, defaultOn: hasContent, hasContent };
    }),
    emergencyContact,
  };
}

/** SHARE-02 공유 초안 + 미리보기 */
export async function createShareDraft(req: ShareDraftRequest): Promise<ShareDraftResponse> {
  // return api.post<ShareDraftResponse>(subjectPath('/shares/drafts'), req);

  // ── 가짜 응답 ──
  const guide = await getGuide();
  if (req.sectionCodes.length === 0) {
    throw new ApiError(400, 'SHARE_NO_SECTION', '공개할 항목을 하나 이상 선택해 주세요.');
  }
  if ((req.documentType === 'DAILY' && !req.sourceDiaryId) || (req.documentType === 'WEEKLY' && !req.periodStart)) {
    throw new ApiError(400, 'SHARE_SOURCE_REQUIRED', '공유할 기록을 선택해 주세요.');
  }
  const { name, age, emergencyContact } = guide.basicInfo;
  const shareId = nextShareId++;
  draftDb.set(shareId, { documentType: req.documentType, recipientLabel: req.recipientLabel });
  return {
    shareId,
    preview: {
      basicInfo: { name, age, ...(req.showEmergencyContact && emergencyContact ? { emergencyContact } : {}) },
      documentType: req.documentType,
      summaryLines: [],
      sections: req.sectionCodes.map((section) => ({
        section,
        entries: guide.sections.find((s) => s.section === section)?.entries.map((e) => e.content) ?? [],
      })),
    },
    validDays: 7,
  };
}

/** SHARE-03 승인 → 링크 발급 (shareUrl은 이때만) */
export async function approveShare(shareId: number): Promise<ShareApproveResponse> {
  // return api.post<ShareApproveResponse>(subjectPath(`/shares/${shareId}/approve`));

  // ── 가짜 응답 (링크는 로컬 /s/{token}으로 열리게) ──
  await mock.delay(600);
  const draft = draftDb.get(shareId);
  if (!draft) throw new ApiError(404, 'SHARE_NOT_FOUND', '링크를 찾을 수 없어요.');
  draftDb.delete(shareId);
  const now = Date.now();
  const approvedAt = toKstIso(now);
  const expiresAt = toKstIso(now + 7 * 24 * 60 * 60 * 1000);
  historyDb = [
    {
      shareId,
      documentType: draft.documentType,
      recipientLabel: draft.recipientLabel,
      createdByName: '김영희',
      approvedAt,
      expiresAt,
      status: 'ACTIVE',
      revocable: true,
    },
    ...historyDb,
  ];
  const token = Math.random().toString(36).slice(2, 12);
  return {
    shareId,
    shareUrl: `${window.location.origin}/s/${token}`,
    documentType: draft.documentType,
    approvedAt,
    expiresAt,
    notice: '이 링크는 지금만 복사할 수 있어요.',
  };
}

/** SHARE-04 공유 내역 */
export async function getShareHistory(): Promise<{ shares: ShareHistoryItem[] }> {
  // return api.get<{ shares: ShareHistoryItem[] }>(subjectPath('/shares'));

  // ── 가짜 응답 ──
  await mock.delay(500);
  return { shares: structuredClone(historyDb) };
}

/** SHARE-05 링크 접근 중지 */
export async function revokeShare(shareId: number): Promise<{ shareId: number; status: ShareStatus }> {
  // return api.post<{ shareId: number; status: ShareStatus }>(subjectPath(`/shares/${shareId}/revoke`));

  // ── 가짜 응답 ──
  await mock.delay(400);
  const item = historyDb.find((s) => s.shareId === shareId);
  if (!item) throw new ApiError(404, 'SHARE_NOT_FOUND', '링크를 찾을 수 없어요.');
  if (item.status !== 'ACTIVE') {
    throw new ApiError(409, 'SHARE_ALREADY_INACTIVE', '이미 만료되었거나 접근이 중지된 링크예요.');
  }
  item.status = 'REVOKED';
  item.revocable = false;
  return { shareId, status: 'REVOKED' };
}

/**
 * PUB-01 수신자 열람 (로그인 없음)
 * 받는 분 브라우저에서 부름: IP당 분당 30회 제한이 받는 분마다 따로 걸리도록
 * 가짜 토큰: /s/expired · /s/revoked · /s/notfound · /s/toomany · /s/error → 오류, 그 외 → 정상
 */
export async function getPublicShare(token: string): Promise<PublicShareResponse> {
  // return api.get<PublicShareResponse>(`/public/shares/${encodeURIComponent(token)}`, { auth: false });

  // ── 가짜 응답 ──
  await mock.delay(400);
  const result = mockPublicShare(token);
  if (!result.ok) throw new ApiError(result.status, result.error.code, result.error.message);
  return result.data as PublicShareResponse;
}
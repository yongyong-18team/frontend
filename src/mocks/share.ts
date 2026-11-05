import {
  SECTION_ORDER,
  WEEKLY_SECTION_ORDER,
  type DocumentType,
  type ShareSectionCode,
} from "@/constants/labels";
import { mockGuide } from "./guide";

/* ---------- 타입 (API 명세 v1.4) ---------- */

/** SHARE-01 응답 */
export type SectionOptionsResponse = {
  documentType: DocumentType;
  options: { sectionCode: ShareSectionCode; defaultOn: boolean; hasContent: boolean }[];
  emergencyContact: { available: boolean; defaultOn: boolean };
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

/** SHARE-02 응답의 preview (= 고정본, PUB-01 content와 같은 모양) */
export type SharePreview = {
  basicInfo: { name: string; age: number; emergencyContact?: string };
  documentType: DocumentType;
  summaryLines: string[];
  sections: { section: ShareSectionCode; entries: string[] }[];
};

/** SHARE-02 응답 */
export type ShareDraftResponse = {
  shareId: number;
  preview: SharePreview;
  validDays: number;
};

/* ---------- 목업 ---------- */

/** SHARE-01 목업: 내용 있는 섹션만 기본 ON, 없는 섹션은 선택 불가, 비상 연락처는 기본 OFF */
export function mockSectionOptions(documentType: DocumentType): SectionOptionsResponse {
  const emergencyContact = { available: !!mockGuide.basicInfo.emergencyContact, defaultOn: false };

  if (documentType === "WEEKLY") {
    return {
      documentType,
      options: WEEKLY_SECTION_ORDER.map((sectionCode) => ({ sectionCode, defaultOn: true, hasContent: true })),
      emergencyContact,
    };
  }

  return {
    documentType,
    options: SECTION_ORDER.map((sectionCode) => {
      const hasContent = (mockGuide.sections.find((s) => s.section === sectionCode)?.entries.length ?? 0) > 0;
      return { sectionCode, defaultOn: hasContent, hasContent };
    }),
    emergencyContact,
  };
}

/** SHARE-02 목업: 고른 섹션의 승인 항목 원문 그대로, 기본 정보는 이름·나이(+비상 연락처) */
export function mockCreateDraft(req: ShareDraftRequest): ShareDraftResponse {
  const { name, age, emergencyContact } = mockGuide.basicInfo;
  return {
    shareId: 900,
    preview: {
      basicInfo: {
        name,
        age,
        ...(req.showEmergencyContact && emergencyContact ? { emergencyContact } : {}),
      },
      documentType: req.documentType,
      summaryLines: [],
      sections: req.sectionCodes.map((section) => ({
        section,
        entries: mockGuide.sections.find((s) => s.section === section)?.entries.map((e) => e.content) ?? [],
      })),
    },
    validDays: 7,
  };
}

/** SHARE-03 응답 (shareUrl은 이 응답에서만 받을 수 있음) */
export type ShareApproveResponse = {
  shareId: number;
  shareUrl: string;
  documentType: DocumentType;
  approvedAt: string;
  expiresAt: string;
  notice: string;
};

/** 시각을 "2026-11-05T21:30:00+09:00" 모양으로 */
function toKstIso(ms: number) {
  return new Date(ms + 9 * 60 * 60 * 1000).toISOString().slice(0, 19) + "+09:00";
}

/** SHARE-03 목업: 승인 시각부터 7일, 링크는 로컬 /s/{token}으로 열리게 */
export function mockApprove(shareId: number, documentType: DocumentType): ShareApproveResponse {
  const now = Date.now();
  const token = Math.random().toString(36).slice(2, 12);
  return {
    shareId,
    shareUrl: `${window.location.origin}/s/${token}`,
    documentType,
    approvedAt: toKstIso(now),
    expiresAt: toKstIso(now + 7 * 24 * 60 * 60 * 1000),
    notice: "이 링크는 지금만 복사할 수 있어요.",
  };
}

/** SHARE-04 응답의 한 줄 */
export type ShareStatus = "ACTIVE" | "EXPIRED" | "REVOKED";

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

/** SHARE-04 목업 (OWNER 기준: 다른 사람이 만든 링크도 중지 가능) */
export const mockShareHistory: ShareHistoryItem[] = [
  {
    shareId: 900,
    documentType: "GUIDE",
    recipientLabel: "목요일 선생님",
    createdByName: "김영희",
    approvedAt: "2026-11-03T21:30:00+09:00",
    expiresAt: "2026-11-10T21:30:00+09:00",
    status: "ACTIVE",
    revocable: true,
  },
  {
    shareId: 905,
    documentType: "GUIDE",
    recipientLabel: "단기보호센터",
    createdByName: "이철수",
    approvedAt: "2026-11-02T10:05:00+09:00",
    expiresAt: "2026-11-09T10:05:00+09:00",
    status: "ACTIVE",
    revocable: true,
  },
  {
    shareId: 870,
    documentType: "DAILY",
    recipientLabel: "주간활동센터",
    createdByName: "김영희",
    approvedAt: "2026-10-20T09:00:00+09:00",
    expiresAt: "2026-10-27T09:00:00+09:00",
    status: "EXPIRED",
    revocable: false,
  },
  {
    shareId: 860,
    documentType: "WEEKLY",
    recipientLabel: null,
    createdByName: "김영희",
    approvedAt: "2026-10-15T18:20:00+09:00",
    expiresAt: "2026-10-22T18:20:00+09:00",
    status: "REVOKED",
    revocable: false,
  },
];

/* ---------- 4.4 수신자 (PUB-01, 로그인 없음) ---------- */

/** PUB-01 응답 */
export type PublicShareResponse = {
  documentType: DocumentType;
  sharedAt: string;
  expiresAt: string;
  content: Omit<SharePreview, "documentType">;
};

export type PublicShareResult =
  | { ok: true; data: PublicShareResponse }
  | { ok: false; status: number; error: { code: string; message: string } };

/**
 * PUB-01 목업: 토큰으로 상태 흉내
 *  /s/expired · /s/revoked · /s/notfound · /s/toomany · /s/error → 오류, 그 외 → 정상
 *  메시지는 API 명세 4장 그대로
 */
export function mockPublicShare(token: string): PublicShareResult {
  const errors: Record<string, PublicShareResult> = {
    expired: { ok: false, status: 410, error: { code: "SHARE_EXPIRED", message: "유효기간이 지난 링크예요. 보호자에게 새 링크를 요청해 주세요." } },
    revoked: { ok: false, status: 410, error: { code: "SHARE_REVOKED", message: "더 이상 볼 수 없는 링크예요." } },
    notfound: { ok: false, status: 404, error: { code: "SHARE_NOT_FOUND", message: "링크를 찾을 수 없어요." } },
    toomany: { ok: false, status: 429, error: { code: "COMMON_TOO_MANY_REQUESTS", message: "잠시 후 다시 시도해 주세요." } },
    error: { ok: false, status: 500, error: { code: "INTERNAL_ERROR", message: "문서를 불러오지 못했어요." } },
  };
  if (errors[token]) return errors[token];

  const { name, age, emergencyContact } = mockGuide.basicInfo;
  return {
    ok: true,
    data: {
      documentType: "GUIDE",
      sharedAt: "2026-11-05T20:50:00+09:00",
      expiresAt: "2026-11-12T20:50:00+09:00",
      content: {
        basicInfo: { name, age, ...(emergencyContact ? { emergencyContact } : {}) },
        summaryLines: [],
        sections: mockGuide.sections
          .filter((s) => s.entries.length > 0)
          .map((s) => ({ section: s.section, entries: s.entries.map((e) => e.content) })),
      },
    },
  };
}
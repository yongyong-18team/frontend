"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Header, Button, Input, Checkbox, Radio, Toggle } from "@/components/common";
import { LockIcon } from "@/components/icons/Icons";
import { SHARE_SECTION_LABEL, type DocumentType, type ShareSectionCode } from "@/constants/labels";
import { mockGuide } from "@/mocks/guide";
import { mockCreateDraft, mockSectionOptions, type SectionOptionsResponse, type ShareDraftRequest } from "@/mocks/share";
import { saveShareDraft, useShareDraft } from "@/lib/shareDraft";

type Props = {
  initialType: DocumentType;
  sourceDiaryId: number | null;
  periodStart: string | null;
};

/** Figma 4.1 문서 유형 문구 */
const TYPE_ITEMS: { type: DocumentType; label: string; description: string; unavailable: string }[] = [
  { type: "GUIDE", label: "돌봄 설명서", description: "누적된 개인별 돌봄 정보", unavailable: "" },
  { type: "DAILY", label: "일일 기록", description: "선택한 날짜의 돌봄 기록", unavailable: "돌봄 기록 목록에서 날짜를 골라 공유할 수 있어요" },
  { type: "WEEKLY", label: "주간 리포트", description: "최근 7일 패턴 요약", unavailable: "주간 리포트 화면에서 공유할 수 있어요" },
];

const RECIPIENT_MAX = 30;

function defaultSelected(options: SectionOptionsResponse): ShareSectionCode[] {
  return options.options.filter((o) => o.defaultOn && o.hasContent).map((o) => o.sectionCode);
}

/** 4.2에서 "이전"으로 돌아왔으면 저장된 선택값으로, 아니면 기본값으로 폼을 시작 */
export default function ShareScopeView(props: Props) {
  const draft = useShareDraft();
  const restored = draft && draft.request.documentType === props.initialType ? draft.request : null;

  return <ShareScopeForm key={restored ? "restored" : "fresh"} {...props} restored={restored} />;
}

function ShareScopeForm({
  initialType,
  sourceDiaryId,
  periodStart,
  restored,
}: Props & { restored: ShareDraftRequest | null }) {
  const router = useRouter();
  const available: Record<DocumentType, boolean> = {
    GUIDE: true,
    DAILY: sourceDiaryId !== null,
    WEEKLY: periodStart !== null,
  };

  const [documentType, setDocumentType] = useState<DocumentType>(initialType);
  // TODO(D4): SHARE-01 API로 교체 (GET /subjects/{subjectId}/shares/section-options?documentType=&sourceDiaryId=&periodStart=)
  const options = useMemo(() => mockSectionOptions(documentType), [documentType]);

  const [selected, setSelected] = useState<ShareSectionCode[]>(
    () => restored?.sectionCodes ?? defaultSelected(mockSectionOptions(initialType)),
  );
  const [showEmergency, setShowEmergency] = useState(restored?.showEmergencyContact ?? false);
  const [recipientLabel, setRecipientLabel] = useState(restored?.recipientLabel ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // TODO(D4): 비상 연락처 번호는 GUIDE-01 basicInfo에서 (SHARE-01에는 번호가 없음)
  const emergencyNumber = mockGuide.basicInfo.emergencyContact;
  const hasAnyContent = options.options.some((o) => o.hasContent);

  const changeType = (type: DocumentType) => {
    const next = mockSectionOptions(type);
    setDocumentType(type);
    setSelected(defaultSelected(next));
    setShowEmergency(next.emergencyContact.defaultOn);
    setError(null);
  };

  const toggleSection = (code: ShareSectionCode, on: boolean) => {
    setSelected((prev) => (on ? [...prev, code] : prev.filter((c) => c !== code)));
    setError(null);
  };

  const handlePreview = async () => {
    if (selected.length === 0) {
      setError("공개할 항목을 하나 이상 선택해 주세요.");
      return;
    }
    const request: ShareDraftRequest = {
      documentType,
      sourceDiaryId: documentType === "DAILY" ? sourceDiaryId : null,
      periodStart: documentType === "WEEKLY" ? periodStart : null,
      sectionCodes: options.options.map((o) => o.sectionCode).filter((c) => selected.includes(c)), // 표시 순서대로
      showEmergencyContact: options.emergencyContact.available && showEmergency,
      recipientLabel: recipientLabel.trim() || null,
    };

    setSubmitting(true);
    // TODO(D4): SHARE-02 API로 교체 (POST /subjects/{subjectId}/shares/drafts). 실패하면 error.message를 setError로.
    const response = mockCreateDraft(request);
    saveShareDraft({ request, response });
    setSubmitting(false);
    router.push("/share/preview");
  };

  return (
    <main className="flex flex-col pb-[120px]">
      <Header title="돌봄 기록 공유" subtitle="공유할 문서와 정보 범위를 선택해요" back />

      <div className="flex flex-col gap-6 px-6">
        {/* 문서 유형 */}
        <section className="flex flex-col gap-3">
          <h2 className="text-subhead font-bold text-text-primary">문서 유형</h2>
          <div role="radiogroup" className="flex flex-col divide-y divide-line-base rounded-card bg-bg-surface px-4 py-1">
            {TYPE_ITEMS.map((item) => (
              <Radio
                key={item.type}
                name="documentType"
                value={item.type}
                label={item.label}
                description={available[item.type] ? item.description : item.unavailable}
                checked={documentType === item.type}
                disabled={!available[item.type]}
                onChange={() => changeType(item.type)}
              />
            ))}
          </div>
        </section>

        {/* 포함할 정보 */}
        <section className="flex flex-col gap-3">
          <div className="flex flex-col gap-0.5">
            <h2 className="text-subhead font-bold text-text-primary">포함할 정보</h2>
            <p className="text-caption text-text-tertiary">선택하지 않은 항목은 공유 문서에 포함되지 않아요</p>
          </div>
          <div className="flex flex-col divide-y divide-line-base rounded-card bg-bg-surface px-4 py-1">
            {options.options.map((o) => (
              <Checkbox
                key={o.sectionCode}
                label={SHARE_SECTION_LABEL[o.sectionCode]}
                description={o.hasContent ? undefined : "아직 작성된 내용이 없어요"}
                checked={selected.includes(o.sectionCode)}
                disabled={!o.hasContent}
                onChange={(e) => toggleSection(o.sectionCode, e.target.checked)}
              />
            ))}
          </div>
          {!hasAnyContent && <p className="text-caption text-pink-strong">공유할 수 있는 승인된 정보가 없어요.</p>}
          {error && <p className="text-caption text-pink-strong">{error}</p>}
        </section>

        {/* 비상 연락처 표시 (기본 OFF) */}
        <section className="rounded-card bg-bg-surface px-4 py-3.5">
          <Toggle
            label="비상 연락처 표시"
            description={emergencyNumber ?? "등록된 비상 연락처가 없어요"}
            checked={showEmergency}
            disabled={!options.emergencyContact.available}
            onChange={(e) => setShowEmergency(e.target.checked)}
          />
        </section>

        {/* 받는 사람 메모 (선택, 30자) */}
        <Input
          label="받는 사람 메모 (선택)"
          placeholder="예) 목요일 선생님"
          value={recipientLabel}
          maxLength={RECIPIENT_MAX}
          helper="공유 내역에서 누구에게 보냈는지 알아보기 쉬워요"
          onChange={(e) => setRecipientLabel(e.target.value)}
        />

        <p className="flex items-start gap-1.5 text-caption font-medium leading-[1.45] text-text-tertiary">
          <LockIcon size={16} className="shrink-0" />
          일기 원문과 보호자 감정 기록은 공유되지 않아요
        </p>

        <Button onClick={handlePreview} disabled={submitting || selected.length === 0}>
          {submitting ? "만드는 중..." : "문서 미리보기"}
        </Button>
      </div>
    </main>
  );
}
import { Chip } from "@/components/common";
import { ChartIcon, PhoneIcon } from "@/components/icons/Icons";
import { SectionIcon, SECTION_TONE, TONE_CLASS } from "@/components/icons/SectionIcons";
import {
  DOCUMENT_TYPE_LABEL,
  SECTION_ORDER,
  SHARE_SECTION_LABEL,
  type DocumentType,
  type SectionCode,
  type ShareSectionCode,
} from "@/constants/labels";

/** SHARE-02 preview / PUB-01 content 와 같은 모양 (고정본) */
export type SharedDocumentProps = {
  documentType: DocumentType;
  basicInfo: { name: string; age: number; emergencyContact?: string };
  summaryLines: string[];
  sections: { section: ShareSectionCode; entries: string[] }[];
  /** 4.4처럼 페이지 제목이 이미 "{이름} 돌봄 안내서"면 카드 제목을 숨김 */
  hideTitle?: boolean;
};

const isGuideSection = (code: ShareSectionCode): code is SectionCode =>
  (SECTION_ORDER as readonly string[]).includes(code);

/**
 * 공유 문서 카드 — 4.2 미리보기와 4.4 수신자 페이지에서 같이 씀
 * 디자인: Figma 3.1 긴급 카드 + 항목 상세 팝업 스타일
 */
export default function SharedDocument({ documentType, basicInfo, summaryLines, sections, hideTitle }: SharedDocumentProps) {
  return (
    <article className="flex flex-col gap-3.5 rounded-card border-[1.5px] border-primary-base bg-bg-surface px-[18px] py-4">
      {/* 기본 정보: 이름·나이 (+비상 연락처) */}
      <div className="flex flex-col items-start gap-[3px]">
        <Chip tone="primary">{DOCUMENT_TYPE_LABEL[documentType]}</Chip>
        {!hideTitle && (
          <h2 className="text-[18px] font-bold leading-[1.35] text-text-primary">{basicInfo.name} 돌봄 안내서</h2>
        )}
        <p className="text-body font-medium leading-[1.45] text-text-secondary">
          이름: {basicInfo.name} / 나이: {basicInfo.age}세
        </p>
      </div>

      {basicInfo.emergencyContact && (
        <div className="flex items-center gap-2 rounded-[12px] bg-pink-soft px-3.5 py-2.5 text-pink-strong">
          <PhoneIcon size={16} className="shrink-0" />
          <span className="min-w-0 flex-1 whitespace-pre-wrap text-[14px] font-bold leading-[1.45]">
            {`비상 연락처: ${basicInfo.emergencyContact}`}
          </span>
        </div>
      )}

      {/* 상단 요약 (MVP에서는 빈 배열 → 안 보임) */}
      {summaryLines.length > 0 && (
        <div className="flex flex-col gap-1 rounded-input bg-bg-subtle p-3">
          {summaryLines.map((line) => (
            <p key={line} className="text-body leading-[1.5] text-text-primary">
              {line}
            </p>
          ))}
        </div>
      )}

      <div className="h-px w-full bg-line-base" />

      {/* 섹션 */}
      <div className="flex flex-col gap-5">
        {sections.map(({ section, entries }) => (
          <section key={section} className="flex flex-col gap-2.5">
            <div className="flex items-center gap-2.5">
              {isGuideSection(section) ? (
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px] ${TONE_CLASS[SECTION_TONE[section]]}`}
                >
                  <SectionIcon section={section} size={18} />
                </span>
              ) : (
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px] ${TONE_CLASS.sky}`}>
                  <ChartIcon size={18} />
                </span>
              )}
              <h3 className="min-w-0 flex-1 text-body font-bold leading-[1.45] text-text-primary">
                {SHARE_SECTION_LABEL[section]}
              </h3>
            </div>

            {entries.length > 0 ? (
              <ul className="flex flex-col gap-1.5 pl-[46px]">
                {entries.map((entry, i) => (
                  <li key={`${section}-${i}`} className="text-body font-medium leading-[1.5] text-text-primary">
                    · {entry}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="pl-[46px] text-body font-medium text-text-tertiary">내용이 없어요</p>
            )}
          </section>
        ))}
      </div>
    </article>
  );
}
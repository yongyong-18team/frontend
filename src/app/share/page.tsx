import ShareScopeView from "@/components/share/ShareScopeView";
import type { DocumentType } from "@/constants/labels";

const TYPES: DocumentType[] = ["GUIDE", "DAILY", "WEEKLY"];

/** 4.1 공유 범위 설정
 *  진입: 3.1·5.3 → ?documentType=GUIDE / 2.4 → ?documentType=DAILY&sourceDiaryId=501 / 2.5 → ?documentType=WEEKLY&periodStart=2026-10-28
 */
export default async function Page({ searchParams }: PageProps<"/share">) {
  const sp = await searchParams;
  const pick = (key: string) => (typeof sp[key] === "string" ? (sp[key] as string) : null);

  const typeParam = pick("documentType") as DocumentType | null;
  const documentType = typeParam && TYPES.includes(typeParam) ? typeParam : "GUIDE";
  const diaryId = Number(pick("sourceDiaryId"));

  return (
    <ShareScopeView
      initialType={documentType}
      sourceDiaryId={Number.isInteger(diaryId) && diaryId > 0 ? diaryId : null}
      periodStart={pick("periodStart")}
    />
  );
}
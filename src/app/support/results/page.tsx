import SupportResultsView from "@/components/support/SupportResultsView";
import { DISTRICT_LABEL, type District } from "@/constants/labels";
import type { CareTerm } from "@/mocks/resource";

const TERMS: CareTerm[] = ["SHORT", "LONG"];

/** 5.2 지원 제도 탐색
 *  진입: 5.1 → ?careTerm=SHORT&neededDate=2026-11-10&district=GIHEUNG / 5.0 → 조건 없이 (등록 지역으로 검색)
 */
export default async function Page({ searchParams }: PageProps<"/support/results">) {
  const sp = await searchParams;
  const pick = (key: string) => (typeof sp[key] === "string" ? (sp[key] as string) : null);

  const term = pick("careTerm") as CareTerm | null;
  const district = pick("district") as District | null;
  const neededDate = pick("neededDate");

  return (
    <SupportResultsView
      careTerm={term && TERMS.includes(term) ? term : null}
      neededDate={neededDate && /^\d{4}-\d{2}-\d{2}$/.test(neededDate) ? neededDate : null}
      initialDistrict={district && district in DISTRICT_LABEL ? district : null}
    />
  );
}
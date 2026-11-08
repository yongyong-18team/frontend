import SupportDetailView from "@/components/support/SupportDetailView";
import { mockResourceDetail } from "@/mocks/resource";

/** 5.3 기관·제도 상세
 *  진입: 5.1 관련 카드 / 5.2 목록 / 5.4 programs / 5.5 "전문기관 지원 확인"
 */
export default async function Page({ params }: PageProps<"/support/[resourceId]">) {
  const { resourceId } = await params;
  const id = Number(resourceId);

  // TODO(D4): RES-01 API로 교체 (GET /resources/{resourceId}), 404면 detail = null
  const detail = Number.isInteger(id) && id > 0 ? mockResourceDetail(id) : null;

  return <SupportDetailView detail={detail} />;
}
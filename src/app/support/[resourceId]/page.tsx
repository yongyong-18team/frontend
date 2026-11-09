import SupportDetailView from "@/components/support/SupportDetailView";

/** 5.3 기관·제도 상세
 *  진입: 5.1 관련 카드 / 5.2 목록 / 5.4 programs / 5.5 "전문기관 지원 확인"
 *  데이터(RES-01)는 로그인 토큰이 필요해서 브라우저에서 불러옴 (SupportDetailView)
 */
export default async function Page({ params }: PageProps<"/support/[resourceId]">) {
  const { resourceId } = await params;
  const id = Number(resourceId);
  // 숫자가 아니면 0 → RES-01이 404 → "지원 정보를 찾을 수 없어요"
  return <SupportDetailView resourceId={Number.isInteger(id) && id > 0 ? id : 0} />;
}
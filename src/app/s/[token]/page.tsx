import type { Metadata } from "next";
import PublicShareView from "@/components/share/PublicShareView";

/** 공유 링크가 검색엔진에 잡히거나 다른 사이트로 주소가 새지 않게 (TRD·API PUB-01) */
export const metadata: Metadata = {
  title: "공유된 돌봄 정보",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

/** 4.4 수신자 페이지 — 로그인·하단 탭·버튼 없음, 보기만
 *  데이터(PUB-01)는 받는 분 브라우저에서 불러옴 (PublicShareView)
 *  목업 상태 확인: /s/expired · /s/revoked · /s/notfound · /s/toomany · /s/error
 */
export default async function ReceiverPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <PublicShareView token={token} />;
}
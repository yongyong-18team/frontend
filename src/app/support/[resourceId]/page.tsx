export default async function Page({
  params,
}: {
  params: Promise<{ resourceId: string }>;
}) {
  const { resourceId } = await params;
  return <main className="p-6">5.3 기관·제도 상세 ({resourceId})</main>;
}
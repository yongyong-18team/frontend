import Link from "next/link";
import { Header, ListRow } from "@/components/common";
import { AlertIcon, CoffeeIcon, SearchIcon } from "@/components/icons/Icons";

/** 5.0 돌봄 지원 메뉴 (Figma 5.0, API 없음) */
export default function SupportMenuPage() {
  return (
    <main className="flex flex-col pb-[120px]">
      <Header title="돌봄 지원" subtitle="용인시 공공 지원 정보를 바탕으로 안내해요" />

      <div className="flex flex-col gap-7 px-6">
        {/* 히어로 → 5.1 */}
        <section className="flex flex-col gap-4 rounded-card bg-sky-soft px-5 py-[18px]">
          <div className="flex items-center gap-3">
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <h2 className="text-[19px] font-bold leading-[1.35] text-text-primary">돌봄 지원이 필요하신가요?</h2>
              <p className="text-[14px] leading-[1.45] text-text-secondary">상황에 맞는 돌봄 지원을 찾아드려요.</p>
            </div>
            <span className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-full bg-sky-base text-sky-strong">
              <SearchIcon size={26} />
            </span>
          </div>
          <Link
            href="/support/find"
            className="flex h-14 w-full items-center justify-center rounded-button bg-primary-strong px-5 text-subhead font-bold text-text-on-primary active:opacity-80"
          >
            관련 지원 찾아보기
          </Link>
        </section>

        {/* 지원받을 수 있는 서비스 */}
        <section className="flex flex-col gap-3">
          <h2 className="text-subhead font-bold text-text-primary">지원받을 수 있는 서비스</h2>
          <div className="flex flex-col divide-y divide-line-base rounded-card bg-bg-surface px-4 py-1">
            {/* 5.0 → 5.2: careTerm 없이 등록 지역으로 탐색 */}
            <ListRow
              size="lg"
              href="/support/results"
              title="돌봄기관·지원제도 찾기"
              description="용인시 공공 지원 정보 기반"
              iconTone="sky"
              icon={<SearchIcon size={22} />}
            />
            <ListRow
              size="lg"
              href="/support/rest"
              title="보호자 휴식·소진 지원"
              description="휴식과 상담을 위한 지원"
              iconTone="peach"
              icon={<CoffeeIcon size={22} />}
            />
            {/* 5.5 위기 안내 (프론트 A) */}
            <ListRow
              size="lg"
              href="/crisis"
              title="긴급 상황 도움받기"
              description="즉각적인 안전 안내"
              iconTone="pink"
              icon={<AlertIcon size={22} />}
            />
          </div>
        </section>
      </div>
    </main>
  );
}
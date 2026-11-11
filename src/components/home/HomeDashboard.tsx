// src/components/home/HomeDashboard.tsx
// 1.1 홈 대시보드 (Figma 59:1099)
//   인사 → 오늘 기록 카드 → 바로가기 3개 → 최근 기록
// 하단 탭은 B의 BottomNav가 layout에서 그립니다 (여기서는 그만큼 아래 여백만 둠)

'use client';

import { useEffect, type ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import Button from '@/components/common/Button';
import Chip from '@/components/common/Chip';
import { EmptyState, ErrorState, LoadingState } from '@/components/common/StateView';
import { ChartIcon, ChevronRightIcon, GuideIcon, SupportIcon, UsersIcon } from '@/components/icons/Icons';
import { useHome } from '@/hooks/useHome';
import { ApiError, CLIENT_ERROR, getErrorMessage } from '@/lib/api/client';
import { dailyRecordHref } from '@/lib/api/dailyRecord';
import type { HomeData, RecentActivity } from '@/lib/api/home';
import { formatKoreanDate, fromDateKey } from '@/lib/date';

// TODO(B): 3.1 설명서·5.0 돌봄 지원·6.2.1 받은 초대 화면 주소 확인 (BottomNav 주소와 같게)
const PATH = {
  newDiary: '/diary/new',
  diaryList: '/diary',
  guide: '/guide',
  support: '/support',
  weeklyReport: '/report',
  invitations: '/settings/invitations',
};

export default function HomeDashboard() {
  const router = useRouter();
  const { state, retry } = useHome();

  // 대상자가 없는 계정이 홈에 오면 온보딩으로
  const noSubject = state.phase === 'error' && state.error instanceof ApiError && state.error.code === CLIENT_ERROR.NO_SUBJECT;
  useEffect(() => {
    if (noSubject) router.replace('/onboarding/step-1');
  }, [noSubject, router]);

  return (
    <main className="mx-auto min-h-dvh w-full max-w-[390px] bg-bg-base px-6 pt-6 pb-[108px]">
      {state.phase === 'loading' && <LoadingState count={3} label="정보를 불러오고 있어요." />}
      {state.phase === 'error' && !noSubject && <ErrorState message={homeErrorMessage(state.error)} onRetry={retry} />}
      {state.phase === 'done' && <Dashboard data={state.data} />}
    </main>
  );
}

/** 인터넷 끊김·시간 초과는 그 안내를, 그 밖에는 홈 조회 실패 문구 */
function homeErrorMessage(error: unknown) {
  if (error instanceof ApiError && (error.code === CLIENT_ERROR.NETWORK || error.code === CLIENT_ERROR.TIMEOUT)) {
    return getErrorMessage(error);
  }
  // 기획 문구 확정안 v1.4 '1.1 조회 실패'
  return '최근 기록을 불러오지 못했어요.';
}

function Dashboard({ data }: { data: HomeData }) {
  const isOwner = data.role === 'OWNER';

  return (
    <div className="flex flex-col">
      {/* 인사 */}
      <header className="flex flex-col gap-1">
        <h1 className="text-[24px] leading-[1.35] font-bold tracking-[-0.015em] text-text-primary">
          {withJosa(data.name, '와', '과')} 오늘도 함께해요
        </h1>
        {data.daysTogether != null && data.daysTogether > 0 && (
          <p className="flex items-center gap-1.5 text-[14px] leading-[1.45] text-text-secondary">
            함께 쌓아온 돌봄 기록
            <Chip tone="primary">{data.daysTogether}일째</Chip>
          </p>
        )}
      </header>

      {/* 받은 초대 (Figma에는 없음, HOME-01의 pendingInvitationCount가 있을 때만) */}
      {data.pendingInvitationCount > 0 && (
        <Link
          href={PATH.invitations}
          className="mt-4 flex items-center gap-3 rounded-card bg-bg-surface px-4 py-3.5 text-text-primary"
        >
          <UsersIcon size={20} className="shrink-0 text-primary-strong" />
          <span className="flex-1 text-body font-bold">받은 초대 {data.pendingInvitationCount}건이 있어요</span>
          <ChevronRightIcon size={20} className="shrink-0 text-text-tertiary" />
        </Link>
      )}

      <TodayCard isOwner={isOwner} todayRecorded={data.todayRecorded} />

      {/* 바로가기 */}
      <section className="mt-4 flex flex-col gap-3" aria-labelledby="home-shortcuts">
        <h2 id="home-shortcuts" className="text-[17px] leading-[1.45] font-bold text-text-primary">
          바로가기
        </h2>
        <div className="flex gap-2">
          <Shortcut href={PATH.guide} title="돌봄 설명서" sub="개인별 돌봄 정보" tone="mint" icon={<GuideIcon size={18} />} />
          <Shortcut href={PATH.support} title="돌봄 지원" sub="공백·지원제도" tone="sky" icon={<SupportIcon size={18} />} />
          <Shortcut href={PATH.weeklyReport} title="주간 리포트" sub="최근 7일 분석" tone="peach" icon={<ChartIcon size={18} />} />
        </div>
      </section>

      <RecentSection isOwner={isOwner} activities={data.recentActivities} />
    </div>
  );
}

/* ───────────── 오늘 기록 카드 ───────────── */

function TodayCard({ isOwner, todayRecorded }: { isOwner: boolean; todayRecorded: boolean }) {
  const router = useRouter();

  // TODO(기획): Figma에는 "아직 안 씀" 상태만 있음. 나머지 두 상태 문구 확인
  const copy = !isOwner
    ? { title: '오늘도 함께 돌봐요', sub: '보호자가 남긴 기록과 설명서를 확인해 보세요.', button: '돌봄 설명서 보기', href: PATH.guide }
    : todayRecorded
      ? { title: '오늘 기록을 남겼어요', sub: '더 남길 일이 생기면 언제든 추가로 기록해요.', button: '기록 추가하기', href: PATH.newDiary }
      : { title: '오늘은 어떤 하루였나요?', sub: '일상의 작은 변화도 중요한 돌봄 정보가 돼요.', button: '오늘 기록 작성하기', href: PATH.newDiary };

  return (
    <section className="relative mt-[18px] h-[196px] overflow-hidden rounded-[24px] bg-primary-soft">
      {/* 장식 원 2개 */}
      <span className="pointer-events-none absolute -top-[50px] -right-[58px] size-[170px] rounded-full bg-peach-base/70" aria-hidden />
      <span className="pointer-events-none absolute top-[90px] -right-[68px] size-[120px] rounded-full bg-butter-base" aria-hidden />

      <div className="relative flex h-full flex-col justify-between px-5 pt-[22px] pb-[22px]">
        <div className="flex flex-col gap-1">
          <h2 className="text-[20px] leading-[1.35] font-bold text-text-primary">{copy.title}</h2>
          <p className="text-[14px] leading-[1.45] text-text-secondary">{copy.sub}</p>
        </div>
        <Button onClick={() => router.push(copy.href)}>{copy.button}</Button>
      </div>
    </section>
  );
}

/* ───────────── 바로가기 카드 ───────────── */

const SHORTCUT_TONE = {
  mint: { card: 'bg-mint-soft', circle: 'bg-mint-base text-mint-strong' },
  sky: { card: 'bg-sky-soft', circle: 'bg-sky-base text-sky-strong' },
  peach: { card: 'bg-peach-soft', circle: 'bg-peach-base text-peach-strong' },
};

function Shortcut({
  href,
  title,
  sub,
  tone,
  icon,
}: {
  href: string;
  title: string;
  sub: string;
  tone: keyof typeof SHORTCUT_TONE;
  icon: ReactNode;
}) {
  return (
    <Link href={href} className={`flex min-h-[130px] min-w-0 flex-1 flex-col gap-2 rounded-[20px] px-3.5 py-3 ${SHORTCUT_TONE[tone].card}`}>
      <span className={`flex size-9 items-center justify-center rounded-full ${SHORTCUT_TONE[tone].circle}`}>{icon}</span>
      <span className="text-[15px] leading-[1.35] font-bold text-text-primary">{title}</span>
      <span className="text-[12px] leading-[1.45] text-text-secondary">{sub}</span>
    </Link>
  );
}

/* ───────────── 최근 기록 ───────────── */

function RecentSection({ isOwner, activities }: { isOwner: boolean; activities: RecentActivity[] }) {
  const router = useRouter();

  return (
    <section className="mt-5 flex flex-col gap-2.5" aria-labelledby="home-recent">
      <div className="flex items-center gap-2">
        <h2 id="home-recent" className="flex-1 text-[17px] leading-[1.45] font-bold text-text-primary">
          최근 기록
        </h2>
        {/* OWNER·공동 관리자 모두 /diary (역할에 따라 2.4 화면이 바뀜) */}
        {activities.length > 0 && (
          <Link href={PATH.diaryList} className="text-caption leading-[1.45] font-medium text-text-tertiary">
            전체보기
          </Link>
        )}
      </div>

      {activities.length === 0 ? (
        <div className="rounded-[20px] bg-bg-surface px-4 py-2">
          <EmptyState
            title="아직 작성한 기록이 없어요."
            description={isOwner ? '오늘 있었던 일을 짧게라도 남겨 보세요.' : '보호자가 기록을 남기면 여기에 보여요.'}
            actionLabel={isOwner ? '첫 기록 작성하기' : undefined}
            onAction={isOwner ? () => router.push(PATH.newDiary) : undefined}
          />
        </div>
      ) : (
        <ul className="rounded-[20px] bg-bg-surface px-4 py-0.5">
          {activities.map((a, i) => (
            <li key={a.diaryId} className={i < activities.length - 1 ? 'border-b border-line-base' : ''}>
              <RecentRow activity={a} isOwner={isOwner} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function RecentRow({ activity, isOwner }: { activity: RecentActivity; isOwner: boolean }) {
  const title = formatKoreanDate(fromDateKey(activity.diaryDate));
  // 공동 관리자에게는 원문이 안 와서 승인 항목 수로 대신 보여줌
  const sub = activity.preview ?? `설명서에 반영된 내용 ${activity.approvedCount}개`;

  const body = (
    <>
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="text-body-lg leading-[1.45] font-bold text-text-primary">{title}</span>
        <span className="truncate text-[14px] leading-[1.45] text-text-secondary">{sub}</span>
      </span>
      {isOwner && activity.pendingCount > 0 && <Chip tone="peach">검토 대기</Chip>}
      {(isOwner || activity.approvedCount > 0) && <ChevronRightIcon size={20} className="shrink-0 text-text-tertiary" />}
    </>
  );

  // 공동 관리자: 반영된 항목이 있으면 REPORT-02 일일 기록 상세, 없으면 볼 내용이 없어 누를 수 없게 둠
  if (!isOwner) {
    if (activity.approvedCount === 0) return <div className="flex items-center gap-3 py-4">{body}</div>;
    return (
      <Link href={dailyRecordHref(activity.diaryId)} className="flex items-center gap-3 py-4">
        {body}
      </Link>
    );
  }

  // 2.4와 같은 규칙: 추출 항목이 있으면 2.3 검토, 아직 분석 전·추출 없음이면 2.2 결과
  const hasItems = activity.pendingCount + activity.approvedCount > 0;
  const href = `/diary/${activity.diaryId}/${hasItems ? 'review' : 'result'}`;
  return (
    <Link href={href} className="flex items-center gap-3 py-4">
      {body}
    </Link>
  );
}

/* ───────────── 받침에 따라 와/과 ───────────── */

function withJosa(word: string, noBatchim: string, batchim: string) {
  const last = word.trim().at(-1);
  if (!last) return word;
  const code = last.charCodeAt(0) - 0xac00;
  if (code < 0 || code > 11171) return `${word}${noBatchim}`; // 한글이 아니면 기본값
  return `${word}${code % 28 === 0 ? noBatchim : batchim}`;
}

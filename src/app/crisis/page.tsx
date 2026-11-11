// src/app/crisis/page.tsx
// 5.5 위기 안전 안내 (Figma node 59:1913, 문구: 기획 문구 확정안 v1.4 5.5 / API 명세 SUP-02)
//
// - 서버가 늦거나 실패해도 바로 떠야 하는 화면이라, 고정 문구(CRISIS_FALLBACK)로 먼저 그리고
//   SUP-02 응답이 오면 바꿔 끼웁니다. (자동 신고·외부 통보 없음)
// - 1577-0199(정신건강 위기상담)는 Figma에 없지만 확정안·명세에 있어 추가했습니다. TODO(B 디자인): 카드 디자인 확인
// - 주소에 params/searchParams가 없어서 loading.tsx는 필요 없습니다.
// - 하단 탭은 디자인상 보이는 화면입니다 (B의 BottomNav가 담당).

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import {
  ChatIcon,
  ChevronRightIcon,
  CoffeeIcon,
  PhoneIcon,
  ShieldIcon,
} from '@/components/icons/Icons';
import Button from '@/components/common/Button';
import Chip from '@/components/common/Chip';
import Header from '@/components/common/Header';
import { CRISIS_FALLBACK, getCrisisGuide, type CrisisContact, type CrisisGuide } from '@/lib/api/crisis';
import { getBurnoutGuide } from '@/lib/api/resource';

// B의 Icons.tsx 아이콘을 이름으로 꺼내 쓰기 위한 연결 (색은 className의 text-...로 지정)
const ICONS = {
  chevronRight: ChevronRightIcon,
  shield: ShieldIcon,
  phone: PhoneIcon,
  coffee: CoffeeIcon,
  chat: ChatIcon,
} as const;

type IconName = keyof typeof ICONS;

function Icon({ name, size, className }: { name: IconName; size: number; className?: string }) {
  const Svg = ICONS[name];
  return <Svg size={size} className={`shrink-0 ${className ?? ''}`} />;
}

/** 연락처 → 카드 모양. 119·112(note 있음)는 긴급(분홍)으로 먼저, 상담 전화(hours 있음)는 하늘색으로 뒤에 */
function toLines(contacts: CrisisContact[]) {
  return [...contacts]
    .sort((a, b) => Number(Boolean(b.note)) - Number(Boolean(a.note)))
    .map((c) => ({
      number: c.phone,
      chip: c.note ? '긴급' : (c.hours ?? '상담'),
      tone: c.note ? ('pink' as const) : ('sky' as const),
      desc: c.note ?? c.name,
    }));
}

// 5.3 상세 /support/[resourceId]
// - 첫 줄: SUP-02 followUp (부모상담 지원)
// - 둘째 줄: 가족휴식지원. 번호는 서버마다 달라서(실제 서버 4, 가짜 서버 1102) SUP-01 programs의 FAMILY_REST에서 찾음
//   못 찾으면 없는 번호로 가지 않게 줄을 숨김
type Rest = { resourceId: number; name: string } | null;

function toResources(followUp: CrisisGuide['followUp'], rest: Rest) {
  const restRow = rest && {
    id: rest.resourceId,
    title: '가족휴식지원',
    desc: '보호자 휴식 지원',
    icon: 'coffee' as const,
    iconBg: 'bg-peach-soft',
    iconColor: 'text-peach-strong',
  };
  const followRow = followUp && {
    id: followUp.resourceId,
    title: followUp.name,
    desc: '보호자 심리상담 연계',
    icon: 'chat' as const,
    iconBg: 'bg-mint-soft',
    iconColor: 'text-mint-strong',
  };
  return [followRow, restRow && restRow.id !== followRow?.id ? restRow : null].filter(
    (row): row is NonNullable<typeof row> => row !== null && row !== undefined,
  );
}

export default function CrisisPage() {
  const router = useRouter();
  // 고정 문구로 먼저 그리고, 서버 응답이 오면 교체 (실패해도 고정 문구 그대로)
  const [guide, setGuide] = useState<CrisisGuide>(CRISIS_FALLBACK);

  // 가족휴식지원 번호 (SUP-01). 응답 전·실패면 줄을 숨김
  const [rest, setRest] = useState<Rest>(null);

  useEffect(() => {
    let cancelled = false;
    getCrisisGuide()
      .then((data) => {
        if (!cancelled && data.contacts.length > 0) setGuide(data);
      })
      .catch(() => {});
    getBurnoutGuide()
      .then((data) => {
        const found = data.programs.find((p) => p.programType === 'FAMILY_REST');
        if (!cancelled && found) setRest({ resourceId: found.resourceId, name: found.name });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const lines = toLines(guide.contacts);
  const resources = toResources(guide.followUp, rest);
  const [headline, ...restMessage] = guide.message;

  return (
    // 위쪽 40px: 상태 표시줄 자리 (Figma 기준 뒤로가기 아이콘이 위에서 54px)
    <main className="mx-auto min-h-dvh w-full max-w-[390px] bg-bg-base pt-10 pb-28">
      <Header
        title="안전을 가장 먼저 확인하세요"
        subtitle="긴급한 상황이라면 바로 전문 기관에 도움을 요청하세요"
        back
      />

      <div className="flex flex-col px-6">
        {/* Header 아래 20px + 6px = Figma 간격 26px */}
        <div className="mt-1.5 flex flex-col gap-6">
          {/* 안전 안내 카드 */}
          <section className="flex items-center gap-[14px] rounded-card bg-pink-soft px-[18px] py-4">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-bg-surface">
              <Icon name="shield" size={24} className="text-pink-strong" />
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <p className="text-body-lg leading-[1.4] font-bold text-text-primary">{headline}</p>
              <p className="text-[14px] leading-[1.5] text-text-secondary">
                {restMessage.join(' ')}
              </p>
            </div>
          </section>

          {/* 긴급 도움 */}
          <section className="flex flex-col gap-3">
            <h2 className="text-subhead font-bold text-text-primary">긴급 도움</h2>
            <ul className="flex flex-col gap-[10px]">
              {lines.map((line) => {
                const isPink = line.tone === 'pink';
                return (
                  <li key={line.number}>
                    {/* 고령 사용자를 고려해 카드 전체를 전화 버튼으로 */}
                    <a
                      href={`tel:${line.number.replace(/[^0-9]/g, '')}`}
                      aria-label={`${line.number}에 전화하기, ${line.desc}`}
                      className="flex items-center gap-3 rounded-card bg-bg-surface px-4 py-[14px] active:opacity-80"
                    >
                      <div className="flex min-w-0 flex-1 flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[22px] leading-[1.2] font-bold text-text-primary">
                            {line.number}
                          </span>
                          <Chip tone={line.tone}>{line.chip}</Chip>
                        </div>
                        <p className="text-caption text-text-secondary">{line.desc}</p>
                      </div>
                      <div
                        className={`flex size-[52px] shrink-0 items-center justify-center rounded-full text-text-on-primary ${
                          isPink ? 'bg-pink-strong' : 'bg-sky-strong'
                        }`}
                      >
                        <Icon name="phone" size={24} />
                      </div>
                    </a>
                  </li>
                );
              })}
            </ul>
          </section>

          {/* 전문 기관 지원 안내 */}
          <section className="flex flex-col gap-3">
            <div className="flex flex-col gap-[2px]">
              <h2 className="text-subhead font-bold text-text-primary">전문 기관 지원 안내</h2>
              {guide.followUp && (
                <p className="text-caption text-text-tertiary">
                  조금 진정된 뒤에는 {guide.followUp.name}도 알아볼 수 있어요.
                </p>
              )}
            </div>
            <ul className="flex flex-col rounded-card bg-bg-surface px-4 py-1">
              {resources.map((item, i) => (
                <li
                  key={item.id}
                  className={i < resources.length - 1 ? 'border-b border-line-base' : ''}
                >
                  <Link
                    href={`/support/${item.id}`}
                    className="flex items-center gap-[14px] py-[14px] active:opacity-80"
                  >
                    <div
                      className={`flex size-11 shrink-0 items-center justify-center rounded-[13px] ${item.iconBg}`}
                    >
                      <Icon name={item.icon} size={22} className={item.iconColor} />
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col gap-[3px]">
                      <p className="text-body-lg leading-[1.45] font-bold text-text-primary">
                        {item.title}
                      </p>
                      <p className="text-caption text-text-secondary">{item.desc}</p>
                    </div>
                    <Icon name="chevronRight" size={20} className="text-text-tertiary" />
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <Button variant="outline" onClick={() => router.push('/support')}>
            돌봄 지원으로 돌아가기
          </Button>
        </div>
      </div>
    </main>
  );
}

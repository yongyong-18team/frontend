// src/app/crisis/page.tsx
// 5.5 위기 안전 안내 (Figma node 59:1913)
//
// - API 없이도 항상 즉시 떠야 하는 화면이라 데이터는 모두 이 파일 안에 둡니다.
// - 주소에 params/searchParams가 없어서 loading.tsx는 필요 없습니다.
// - 하단 탭은 디자인상 보이는 화면입니다 (B의 BottomNav가 담당).

'use client';

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

const EMERGENCY_LINES = [
  { number: '119', chip: '긴급', tone: 'pink', desc: '응급 구조 · 긴급 상황 즉시 신고' },
  { number: '112', chip: '긴급', tone: 'pink', desc: '경찰 · 위험 상황 신고' },
  { number: '109', chip: '24시간', tone: 'sky', desc: '자살예방상담전화 · 전문 위기 상담' },
] as const;

// TODO: B에게 받은 실제 resourceId로 교체 (5.3 상세 /support/[resourceId])
const SUPPORT_RESOURCES = [
  {
    id: 'TODO-family-rest',
    title: '가족휴식지원',
    desc: '보호자 휴식 지원',
    icon: 'coffee',
    iconBg: 'bg-peach-soft',
    iconColor: 'text-peach-strong',
  },
  {
    id: 'TODO-parent-counsel',
    title: '부모상담 지원',
    desc: '보호자 심리상담 연계',
    icon: 'chat',
    iconBg: 'bg-mint-soft',
    iconColor: 'text-mint-strong',
  },
] as const;

// TODO: 사용자 프로필의 저장된 지역으로 교체 (constants/labels.ts의 DISTRICT_LABEL 사용)
const SAVED_REGION_LABEL = '용인시 기흥구';

export default function CrisisPage() {
  const router = useRouter();

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
              <p className="text-body-lg leading-[1.4] font-bold text-text-primary">
                지금 즉각적인 도움이 필요한가요?
              </p>
              <p className="text-[14px] leading-[1.5] text-text-secondary">
                안전을 먼저 확보하고, 필요하면 아래 번호로 바로 연락하세요.
              </p>
            </div>
          </section>

          {/* 긴급 도움 */}
          <section className="flex flex-col gap-3">
            <h2 className="text-subhead font-bold text-text-primary">긴급 도움</h2>
            <ul className="flex flex-col gap-[10px]">
              {EMERGENCY_LINES.map((line) => {
                const isPink = line.tone === 'pink';
                return (
                  <li key={line.number}>
                    {/* 고령 사용자를 고려해 카드 전체를 전화 버튼으로 */}
                    <a
                      href={`tel:${line.number}`}
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
              <p className="text-caption text-text-tertiary">
                저장된 지역({SAVED_REGION_LABEL}) 기준으로 안내해요
              </p>
            </div>
            <ul className="flex flex-col rounded-card bg-bg-surface px-4 py-1">
              {SUPPORT_RESOURCES.map((item, i) => (
                <li
                  key={item.id}
                  className={i < SUPPORT_RESOURCES.length - 1 ? 'border-b border-line-base' : ''}
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

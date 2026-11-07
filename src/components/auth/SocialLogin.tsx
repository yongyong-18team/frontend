// src/components/auth/SocialLogin.tsx
// 0.1 하단 간편 로그인 (카카오·구글)
// API 명세에 간편 로그인 API가 없어서 지금은 누르면 "준비 중" 안내만 합니다.
// TODO(백엔드 A·기획): 간편 로그인을 MVP에 넣는지 확인

'use client';

/* eslint-disable @next/next/no-img-element -- 작은 고정 아이콘이라 img 사용 */

type Props = { onUnavailable: () => void };

export default function SocialLogin({ onUnavailable }: Props) {
  return (
    <div className="flex items-center justify-center gap-7">
      <SocialButton label="카카오" onClick={onUnavailable} circleClass="bg-[#f6f608]">
        {/* 이미지가 원을 꽉 채우도록 (크기가 어긋나면 size-full을 size-[30px] 같은 숫자로 조절) */}
        <img src="/images/kakao.png" alt="" width={52} height={52} className="size-full object-cover" />
      </SocialButton>
      <SocialButton label="구글" onClick={onUnavailable} circleClass="bg-bg-surface">
        {/* 구글 로고는 원 안에 작게 (모양이 잘리지 않게 contain) */}
        <img src="/images/google.png" alt="" width={52} height={52} className="size-full object-cover" />
      </SocialButton>
    </div>
  );
}

function SocialButton({
  label,
  circleClass,
  onClick,
  children,
}: {
  label: string;
  circleClass: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button type="button" onClick={onClick} className="flex flex-col items-center gap-1.5" aria-label={`${label}로 로그인`}>
      <span
        className={`flex size-[52px] items-center justify-center overflow-hidden rounded-full border border-line-strong ${circleClass}`}
      >
        {children}
      </span>
      <span className="text-micro leading-[1.45] font-medium text-text-secondary">{label}</span>
    </button>
  );
}

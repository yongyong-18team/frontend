// src/components/onboarding/ProfileAvatar.tsx
// 0.2-1·0.2-2 위쪽 프로필 동그라미 (100px) + 카메라 배지
//   - 0.2-1 보호자: 연한 주황 / 0.2-2 대상자: 연한 노랑
// 명세에 프로필 사진 API가 없어서 카메라는 "준비 중" 안내만 합니다. TODO(기획): 사진 등록을 MVP에 넣는지 확인

'use client';

import { CameraIcon, UserIcon } from '@/components/icons/Icons';

type Props = {
  tone: 'primary' | 'butter';
  onCameraClick: () => void;
};

const TONE = {
  primary: 'bg-primary-soft text-primary-strong',
  butter: 'bg-butter-soft text-butter-strong',
};

export default function ProfileAvatar({ tone, onCameraClick }: Props) {
  return (
    <div className="flex justify-center">
      <div className={`relative flex size-[100px] items-center justify-center rounded-full ${TONE[tone]}`}>
        <UserIcon size={40} />
        <button
          type="button"
          onClick={onCameraClick}
          aria-label="프로필 사진 등록"
          className="absolute -right-0.5 -bottom-0.5 flex size-[34px] items-center justify-center rounded-full border-[3px] border-bg-base bg-primary-strong text-text-on-primary"
        >
          <CameraIcon size={14} />
        </button>
      </div>
    </div>
  );
}

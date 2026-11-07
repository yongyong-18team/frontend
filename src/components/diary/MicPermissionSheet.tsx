// src/components/diary/MicPermissionSheet.tsx
// 2.1 [예외] 녹음 권한 거부 바텀시트 (Figma node 35:2428)
// 딤·Esc 닫기·스크롤 막기는 B의 공통 BottomSheet가 처리합니다.
//
// 웹에서는 휴대폰 설정 앱을 직접 열 수 없어서,
// "설정 열기"를 누르면 브라우저에서 마이크를 허용하는 방법을 보여주고
// 허용 후 새로고침할 수 있게 했습니다.

'use client';

import { useState } from 'react';

import Button from '@/components/common/Button';
import { BottomSheet } from '@/components/common/Overlay';
import { MicOffIcon } from '@/components/icons/Icons';

type Props = {
  open: boolean;
  onClose: () => void;
  /** "텍스트로 입력" — 시트를 닫고 입력창으로 이동 */
  onTypeInstead: () => void;
};

const GUIDE_STEPS = [
  '주소창 왼쪽의 자물쇠(또는 설정) 아이콘을 눌러요',
  '마이크를 ‘허용’으로 바꿔요',
  '아래 버튼을 눌러 화면을 새로고침해요',
];

export default function MicPermissionSheet({ open, onClose, onTypeInstead }: Props) {
  const [showGuide, setShowGuide] = useState(false);

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      footer={
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={onTypeInstead}>
            텍스트로 입력
          </Button>
          {showGuide ? (
            <Button className="flex-1" onClick={() => window.location.reload()}>
              새로고침
            </Button>
          ) : (
            <Button className="flex-1" onClick={() => setShowGuide(true)}>
              설정 열기
            </Button>
          )}
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="flex size-14 items-center justify-center rounded-full bg-pink-soft text-pink-strong">
          <MicOffIcon size={26} />
        </div>

        <div className="flex flex-col gap-1.5">
          <h2 className="text-[21px] leading-[1.35] font-bold text-text-primary">마이크 권한이 필요해요</h2>
          {showGuide ? (
            <ol className="flex list-decimal flex-col gap-1 pl-5 text-body leading-[1.5] text-text-secondary">
              {GUIDE_STEPS.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          ) : (
            <p className="text-body leading-[1.5] text-text-secondary">
              음성으로 기록하려면 브라우저 설정에서 마이크 접근을 허용해 주세요. 텍스트로 바로 입력할 수도
              있어요.
            </p>
          )}
        </div>
      </div>
    </BottomSheet>
  );
}

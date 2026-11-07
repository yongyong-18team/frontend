// src/components/onboarding/GuardianStep.tsx
// 0.2-1 보호자 등록 (Figma 34:1736) / [예외] 다 안 채움 (35:2064) / [상태] 관계 펼침 (59:2472)
// 이름·관계를 모두 채워야 "다음"이 켜집니다.
// 보호자 태어난 연도는 받지 않아서 Figma의 연도 칸은 뺐습니다 (기획 문구 확정안 v1.4 [개발 확정])

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import Button from '@/components/common/Button';
import { Modal } from '@/components/common/Overlay';
import AuthField from '@/components/auth/AuthField';
import OnboardingShell from '@/components/onboarding/OnboardingShell';
import ProfileAvatar from '@/components/onboarding/ProfileAvatar';
import SelectField from '@/components/onboarding/SelectField';
import { useOnboardingGate } from '@/hooks/useOnboardingGate';
import { RELATIONS } from '@/lib/api/onboarding';
import { clearSession } from '@/lib/auth/session';
import { clearDraft, isGuardianDone, updateDraft } from '@/lib/onboarding/draft';

export default function GuardianStep() {
  const router = useRouter();
  const { draft, ready } = useOnboardingGate(1);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [nameTouched, setNameTouched] = useState(false);

  if (!ready) return null;

  const { guardian } = draft;
  const done = isGuardianDone(draft);
  const nameMissing = nameTouched && guardian.displayName.trim().length === 0;
  const setGuardian = (change: Partial<typeof guardian>) =>
    updateDraft((d) => ({ ...d, guardian: { ...d.guardian, ...change } }));

  // 첫 단계에서 뒤로 = 등록을 그만두고 로그인 화면으로 (대상자가 없으면 다른 화면을 쓸 수 없어서)
  const leave = () => {
    clearDraft();
    clearSession();
    router.replace('/login');
  };

  return (
    <OnboardingShell
      step={1}
      title="보호자 등록"
      description="먼저 보호자님에 대해 알려주세요."
      onBack={() => setLeaveOpen(true)}
      footer={
        <>
          <Button disabled={!done} onClick={() => router.push('/onboarding/step-2')}>
            다음
          </Button>
          <p className="text-caption leading-[1.45] text-text-tertiary">
            {done ? '언제든 수정할 수 있어요.' : '모든 항목을 입력하면 다음으로 넘어갈 수 있어요'}
          </p>
        </>
      }
    >
      <div className="flex flex-col gap-5">
        <ProfileAvatar tone="primary" onCameraClick={() => setNotice('프로필 사진 등록은 준비 중이에요.')} />
        {notice && (
          <p className="-mt-2 text-center text-caption text-text-secondary" role="status">
            {notice}
          </p>
        )}
        <AuthField
          id="guardian-name"
          label="이름"
          value={guardian.displayName}
          onChange={(e) => setGuardian({ displayName: e.target.value })}
          onBlur={() => setNameTouched(true)}
          placeholder="이름을 입력해 주세요"
          autoComplete="name"
          maxLength={20}
          status={nameMissing ? 'error' : 'default'}
          helper={nameMissing ? '이름을 입력해 주세요.' : null}
        />
        <SelectField
          label="보호자 관계"
          value={guardian.relation}
          options={RELATIONS}
          placeholder="선택해 주세요"
          onChange={(relation) => setGuardian({ relation })}
        />
      </div>

      <Modal
        open={leaveOpen}
        title="등록을 그만둘까요?"
        message="입력한 내용은 지워지고 로그인 화면으로 돌아가요."
        confirmLabel="그만두기"
        cancelLabel="계속 입력"
        onConfirm={leave}
        onClose={() => setLeaveOpen(false)}
      />
    </OnboardingShell>
  );
}

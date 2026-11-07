// src/components/onboarding/SubjectStep.tsx
// 0.2-2 돌봄 프로필(기본) (Figma 34:1766) / [상태] 연도·지역 펼침 (59:2552 · 59:2602)
// 이름(2~20자)·태어난 연도·구를 채워야 "다음"이 켜집니다. 상세 지역(동)은 골라도 되고 안 골라도 돼요.

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import Button from '@/components/common/Button';
import AuthField from '@/components/auth/AuthField';
import { InfoIcon } from '@/components/icons/Icons';
import OnboardingShell from '@/components/onboarding/OnboardingShell';
import ProfileAvatar from '@/components/onboarding/ProfileAvatar';
import SelectField from '@/components/onboarding/SelectField';
import { useOnboardingGate } from '@/hooks/useOnboardingGate';
import { birthYearOptions, DISTRICTS, DONGS, isValidName, NAME_RULE_MESSAGE } from '@/lib/api/onboarding';
import { isSubjectDone, updateDraft } from '@/lib/onboarding/draft';

const YEAR_OPTIONS = birthYearOptions().map((y) => ({ value: y, label: `${y}년` }));

export default function SubjectStep() {
  const router = useRouter();
  const { draft, ready } = useOnboardingGate(2);
  const [nameTouched, setNameTouched] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  if (!ready) return null;

  const { subject } = draft;
  const done = isSubjectDone(draft);
  const nameError = nameTouched && subject.name.trim().length > 0 && !isValidName(subject.name);
  const setSubject = (change: Partial<typeof subject>) =>
    updateDraft((d) => ({ ...d, subject: { ...d.subject, ...change } }));

  const dongOptions = subject.district ? DONGS[subject.district].map((dong) => ({ value: dong, label: dong })) : [];
  // 목록에 없는 동(이전 버전에서 저장된 값)은 고르지 않은 것으로
  const dongValue = dongOptions.some((o) => o.value === subject.dong) ? subject.dong : null;

  return (
    <OnboardingShell
      step={2}
      title="돌봄 프로필"
      description="돌봄 받는 분의 기본 정보를 알려주세요."
      onBack={() => router.push('/onboarding/step-1')}
      footer={
        <>
          <Button disabled={!done} onClick={() => router.push('/onboarding/step-3')}>
            다음
          </Button>
          <p className="text-caption leading-[1.45] text-text-tertiary">
            {done ? '언제든 수정할 수 있어요.' : '모든 항목을 입력하면 다음으로 넘어갈 수 있어요'}
          </p>
        </>
      }
    >
      <div className="flex flex-col gap-5">
        <ProfileAvatar tone="butter" onCameraClick={() => setNotice('프로필 사진 등록은 준비 중이에요.')} />
        {notice && (
          <p className="-mt-2 text-center text-caption text-text-secondary" role="status">
            {notice}
          </p>
        )}
        <AuthField
          id="subject-name"
          label="이름 또는 별칭"
          value={subject.name}
          onChange={(e) => setSubject({ name: e.target.value })}
          onBlur={() => setNameTouched(true)}
          placeholder="예) 민준이"
          maxLength={20}
          status={nameError ? 'error' : 'default'}
          helper={nameError ? NAME_RULE_MESSAGE : null}
        />
        <SelectField
          label="태어난 연도"
          value={subject.birthYear}
          options={YEAR_OPTIONS}
          placeholder="선택해 주세요"
          scrollHint={2010}
          onChange={(birthYear) => setSubject({ birthYear })}
        />

        <div className="flex flex-col gap-2">
          <span className="text-body leading-[1.45] font-bold text-text-primary">지역</span>
          <div className="flex gap-2">
            <div className="min-w-0 flex-1">
              <SelectField
                ariaLabel="지역(구)"
                value={subject.district}
                options={DISTRICTS}
                placeholder="구 선택"
                // 구를 바꾸면 동은 다시 고르기
                onChange={(district) => setSubject({ district, dong: district === subject.district ? subject.dong : null })}
              />
            </div>
            <div className="min-w-0 flex-1">
              <SelectField
                ariaLabel="상세 지역(동)"
                value={dongValue}
                options={dongOptions}
                placeholder="상세 지역"
                disabled={!subject.district}
                onChange={(dong) => setSubject({ dong })}
              />
            </div>
          </div>
          <p className="flex items-center gap-1.5 text-caption leading-[1.45] font-medium text-mint-strong">
            <InfoIcon size={16} className="shrink-0" />
            지역에 맞는 돌봄 지원 정보를 안내해 드려요.
          </p>
        </div>
      </div>
    </OnboardingShell>
  );
}

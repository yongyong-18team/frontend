// src/components/onboarding/ConfirmStep.tsx
// 0.2-4 내용 확인·동의 (Figma 34:1856) / [예외] 필수 동의 안 함 (35:1990)
//   - 대상자 정보·지역 줄을 누르면 0.2-2로, 돌봄 정보는 0.2-3에서 쓴 답을 보여줌
//   - 필수 동의 2개를 모두 체크해야 "등록 완료" → ONB-01 한 번에 보내기 → 홈

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import Button from '@/components/common/Button';
import Chip from '@/components/common/Chip';
import { BottomSheet } from '@/components/common/Overlay';
import { AlertIcon, CheckIcon, ChevronRightIcon } from '@/components/icons/Icons';
import OnboardingShell from '@/components/onboarding/OnboardingShell';
import { useOnboardingGate } from '@/hooks/useOnboardingGate';
import { ApiError, getErrorMessage } from '@/lib/api/client';
import {
  ageFromBirthYear,
  CONSENT_GROUPS,
  DISTRICTS,
  getTerms,
  QUESTIONS,
  submitOnboarding,
  type Term,
} from '@/lib/api/onboarding';
import { setSubjectId, setSubjectRole } from '@/lib/auth/session';
import { clearDraft } from '@/lib/onboarding/draft';

type GroupId = (typeof CONSENT_GROUPS)[number]['id'];

/** 돌봄 정보 줄 앞 점 색 (Figma: 연두 → 노랑 → 하늘 순서로 반복) */
const DOT_COLORS = ['bg-mint-base', 'bg-butter-base', 'bg-sky-base'];

export default function ConfirmStep() {
  const router = useRouter();
  const { draft, ready } = useOnboardingGate(4);
  const [checked, setChecked] = useState<Record<GroupId, boolean>>({ privacy: false, sensitive: false });
  const [touched, setTouched] = useState(false);
  const [terms, setTerms] = useState<Term[] | null>(null);
  const [termsError, setTermsError] = useState(false);
  const [viewing, setViewing] = useState<GroupId | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // TERMS-01: 동의 항목 버전·내용
  useEffect(() => {
    let cancelled = false;
    getTerms()
      .then((list) => !cancelled && setTerms(list))
      .catch(() => !cancelled && setTermsError(true));
    return () => {
      cancelled = true;
    };
  }, []);

  if (!ready) return null;

  const { subject, profile } = draft;
  const allChecked = CONSENT_GROUPS.every((g) => checked[g.id]);
  const answers = QUESTIONS.map((q) => profile[q.key].trim()).filter(Boolean);
  const districtLabel = DISTRICTS.find((d) => d.value === subject.district)?.label ?? '';

  const toggle = (id: GroupId) => {
    setTouched(true);
    setError(null);
    setChecked((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSubmit = async () => {
    if (!allChecked || !terms || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await submitOnboarding({
        guardian: { displayName: draft.guardian.displayName.trim(), relation: draft.guardian.relation! },
        subject: {
          name: subject.name.trim(),
          birthYear: subject.birthYear!,
          district: subject.district!,
          dong: subject.dong,
        },
        // 빈 답은 null (서버가 항목을 만들지 않음)
        profile: Object.fromEntries(QUESTIONS.map((q) => [q.key, profile[q.key].trim() || null])) as Record<
          (typeof QUESTIONS)[number]['key'],
          string | null
        >,
        consents: terms
          .filter((t) => CONSENT_GROUPS.some((g) => checked[g.id] && g.types.includes(t.consentType)))
          .map((t) => ({ consentType: t.consentType, termsVersion: t.termsVersion })),
      });
      setSubjectId(res.subjectId);
      setSubjectRole(res.subjectId, 'OWNER'); // 온보딩으로 만든 대상자는 내가 OWNER
      clearDraft();
      router.replace('/home');
    } catch (err) {
      if (err instanceof ApiError && err.code === 'ONB_ALREADY_COMPLETED') {
        // 이미 등록됨 → 다시 로그인하면 대상자 정보를 받아 홈으로 감
        setError(`${err.message} 다시 로그인해 주세요.`);
      } else if (err instanceof ApiError && (err.code === 'SUBJECT_INVALID_NAME' || err.code === 'SUBJECT_INVALID_BIRTH_YEAR')) {
        setError(`${err.message} (2단계에서 고칠 수 있어요)`);
      } else {
        setError(getErrorMessage(err));
      }
      setSubmitting(false);
    }
  };

  const viewingGroup = CONSENT_GROUPS.find((g) => g.id === viewing);
  const viewingTerms = viewingGroup && terms ? terms.filter((t) => viewingGroup.types.includes(t.consentType)) : [];

  return (
    <OnboardingShell
      step={4}
      title="내용 확인"
      description="입력하신 내용은 언제든 수정할 수 있어요."
      onBack={() => router.push('/onboarding/step-3')}
      footer={
        <>
          {error && (
            <p className="text-center text-caption text-pink-strong" role="alert">
              {error}
            </p>
          )}
          <Button disabled={!allChecked || !terms || submitting} onClick={handleSubmit}>
            {submitting ? '등록하는 중…' : '등록 완료'}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-3.5">
        {/* 대상자 정보 */}
        <section className="rounded-[20px] bg-bg-surface px-[18px] pt-4 pb-1">
          <h2 className="text-caption leading-[1.45] font-bold text-primary-strong">대상자 정보</h2>
          <SummaryRow
            title={`${subject.name.trim()} · ${ageFromBirthYear(subject.birthYear!)}세`}
            sub={`${subject.birthYear}년생`}
            onClick={() => router.push('/onboarding/step-2')}
            divider
          />
          <SummaryRow
            title="지역"
            sub={subject.dong ? `${districtLabel} ${subject.dong}` : districtLabel}
            onClick={() => router.push('/onboarding/step-2')}
          />
        </section>

        {/* 돌봄 정보 */}
        <section className="flex flex-col gap-2.5 rounded-[20px] bg-bg-surface px-[18px] py-4">
          <h2 className="text-caption leading-[1.45] font-bold text-primary-strong">돌봄 정보</h2>
          {answers.length > 0 ? (
            answers.map((answer, i) => (
              <p key={i} className="flex items-start gap-2.5 text-body leading-[1.45] font-medium text-text-primary">
                <span className={`mt-[7px] size-2.5 shrink-0 rounded-full ${DOT_COLORS[i % DOT_COLORS.length]}`} aria-hidden />
                <span className="line-clamp-2 min-w-0 flex-1">{answer}</span>
              </p>
            ))
          ) : (
            <button type="button" onClick={() => router.push('/onboarding/step-3')} className="text-left text-body leading-[1.45] text-text-secondary">
              아직 입력한 특성이 없어요. <span className="font-bold text-primary-strong underline">지금 입력하기</span>
            </button>
          )}
        </section>

        {/* 동의 */}
        <section className="flex flex-col gap-3 pt-1.5" aria-label="필수 동의">
          {CONSENT_GROUPS.map((group) => (
            <div key={group.id} className="flex items-center gap-2">
              <button
                type="button"
                role="checkbox"
                aria-checked={checked[group.id]}
                onClick={() => toggle(group.id)}
                className="flex min-w-0 flex-1 items-center gap-2 text-left"
              >
                <span
                  className={`flex size-6 shrink-0 items-center justify-center rounded-[7px] ${
                    checked[group.id] ? 'bg-primary-strong text-text-on-primary' : 'border-[1.5px] border-line-strong bg-bg-surface'
                  }`}
                >
                  {checked[group.id] && <CheckIcon size={14} />}
                </span>
                <Chip tone="butter">필수</Chip>
                <span className="min-w-0 flex-1 text-[14px] leading-[1.45] font-medium text-text-primary">{group.label}</span>
              </button>
              <button
                type="button"
                onClick={() => setViewing(group.id)}
                disabled={!terms}
                className="shrink-0 text-caption leading-[1.45] font-medium text-text-tertiary underline"
              >
                보기
              </button>
            </div>
          ))}
          {touched && !allChecked && (
            <p className="flex items-center gap-1.5 text-caption leading-[1.45] font-medium text-pink-strong" role="alert">
              <AlertIcon size={16} className="shrink-0" />
              필수 동의를 완료해야 등록할 수 있어요.
            </p>
          )}
          {termsError && (
            <p className="text-caption text-pink-strong" role="alert">
              동의 항목을 불러오지 못했어요. 새로고침해 주세요.
            </p>
          )}
        </section>
      </div>

      {/* 약관 보기 */}
      <BottomSheet
        open={viewing !== null}
        title={viewingGroup?.label}
        onClose={() => setViewing(null)}
        footer={
          <Button
            onClick={() => {
              if (viewing && !checked[viewing]) toggle(viewing);
              setViewing(null);
            }}
          >
            {viewing && checked[viewing] ? '확인' : '동의하기'}
          </Button>
        }
      >
        <div className="flex flex-col gap-4">
          {viewingTerms.map((t) => (
            <div key={t.consentType} className="flex flex-col gap-1">
              <h3 className="text-body font-bold text-text-primary">
                {t.title} <span className="text-caption font-medium text-text-tertiary">v{t.termsVersion}</span>
              </h3>
              <p className="text-[14px] leading-[1.6] whitespace-pre-line text-text-secondary">{t.content}</p>
            </div>
          ))}
        </div>
      </BottomSheet>
    </OnboardingShell>
  );
}

function SummaryRow({ title, sub, onClick, divider }: { title: string; sub: string; onClick: () => void; divider?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-3 py-4 text-left ${divider ? 'border-b border-line-base' : ''}`}
    >
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="text-body-lg leading-[1.45] font-bold text-text-primary">{title}</span>
        <span className="text-[14px] leading-[1.45] text-text-secondary">{sub}</span>
      </span>
      <ChevronRightIcon size={20} className="shrink-0 text-text-tertiary" />
    </button>
  );
}

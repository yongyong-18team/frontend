// src/components/onboarding/ProfileStep.tsx
// 0.2-3 돌봄 프로필(특성 상세) (Figma 34:1803)
//   - 질문마다 서술형 답 + 마이크(말하면 글로 바꿔서 답 뒤에 붙임, 2.1과 같은 STT)
//   - 모두 비워도 넘어갈 수 있음 ("건너뛰고 나중에 작성할 수도 있어요")

'use client';

import { useCallback, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

import Button from '@/components/common/Button';
import Chip from '@/components/common/Chip';
import MicPermissionSheet from '@/components/diary/MicPermissionSheet';
import { MicIcon } from '@/components/icons/Icons';
import OnboardingShell from '@/components/onboarding/OnboardingShell';
import { useOnboardingGate } from '@/hooks/useOnboardingGate';
import { useRecorder, type RecorderError } from '@/hooks/useRecorder';
import { getErrorMessage } from '@/lib/api/client';
import { STT_MAX_SECONDS, transcribeAudio } from '@/lib/api/diary';
import { QUESTIONS, type QuestionKey } from '@/lib/api/onboarding';
import { updateDraft } from '@/lib/onboarding/draft';

const MAX_ANSWER = 500;

const RECORDER_ERROR_MESSAGE: Partial<Record<RecorderError, string>> = {
  unsupported: '이 브라우저에서는 녹음을 쓸 수 없어요. 글로 입력해 주세요.',
  insecure: '보안 연결(https)에서만 녹음할 수 있어요. 글로 입력해 주세요.',
  'no-device': '마이크를 찾을 수 없어요. 글로 입력해 주세요.',
  unknown: '녹음을 시작하지 못했어요. 다시 시도해 주세요.',
};

export default function ProfileStep() {
  const router = useRouter();
  const { draft, ready } = useOnboardingGate(3);
  /** 지금 녹음 중이거나 글로 바꾸는 중인 질문 */
  const [activeKey, setActiveKey] = useState<QuestionKey | null>(null);
  const [transcribing, setTranscribing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [permissionOpen, setPermissionOpen] = useState(false);
  const activeKeyRef = useRef<QuestionKey | null>(null);
  const textareaRefs = useRef<Partial<Record<QuestionKey, HTMLTextAreaElement | null>>>({});

  const setAnswer = (key: QuestionKey, value: string) =>
    updateDraft((d) => ({ ...d, profile: { ...d.profile, [key]: value.slice(0, MAX_ANSWER) } }));

  // 녹음이 끝나면 글로 바꿔서 그 질문 답 뒤에 붙이기
  const handleRecorded = useCallback(async (audio: Blob) => {
    const key = activeKeyRef.current;
    if (!key) return;
    setTranscribing(true);
    try {
      const { text } = await transcribeAudio(audio);
      updateDraft((d) => {
        const before = d.profile[key].trim();
        const next = before ? `${before} ${text.trim()}` : text.trim();
        return { ...d, profile: { ...d.profile, [key]: next.slice(0, MAX_ANSWER) } };
      });
    } catch (err) {
      setMessage(getErrorMessage(err));
    } finally {
      setTranscribing(false);
      setActiveKey(null);
      activeKeyRef.current = null;
    }
  }, []);

  const recorder = useRecorder({ maxSeconds: STT_MAX_SECONDS, onComplete: handleRecorded });
  const isRecording = recorder.status === 'recording';

  if (!ready) return null;

  const toggleMic = async (key: QuestionKey) => {
    setMessage(null);
    if (transcribing) return;
    // 같은 질문 마이크를 다시 누르면 녹음 끝
    if (isRecording) {
      recorder.stop();
      return;
    }
    if (recorder.permission === 'denied') {
      setPermissionOpen(true);
      return;
    }
    activeKeyRef.current = key;
    setActiveKey(key);
    const error = await recorder.start();
    if (error) {
      setActiveKey(null);
      activeKeyRef.current = null;
      if (error === 'permission-denied') setPermissionOpen(true);
      else setMessage(RECORDER_ERROR_MESSAGE[error] ?? RECORDER_ERROR_MESSAGE.unknown!);
    }
  };

  const goNext = () => {
    if (isRecording) recorder.stop();
    router.push('/onboarding/step-4');
  };

  return (
    <OnboardingShell
      step={3}
      title="특성 상세"
      description="자세히 알려주실수록 더 정확하게 정리해 드려요."
      onBack={() => router.push('/onboarding/step-2')}
      footer={
        <>
          <Button onClick={goNext} disabled={transcribing}>
            다음
          </Button>
          <p className="text-caption leading-[1.45] text-text-tertiary">건너뛰고 나중에 작성할 수도 있어요.</p>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        {message && (
          <p className="text-caption text-pink-strong" role="alert">
            {message}
          </p>
        )}
        {QUESTIONS.map((q) => {
          const isActive = activeKey === q.key;
          const recordingThis = isActive && isRecording;
          const transcribingThis = isActive && transcribing;
          return (
            <div key={q.key} className="flex flex-col gap-2">
              <label htmlFor={`answer-${q.key}`} className="flex items-center gap-2">
                <Chip tone="primary">{q.key}</Chip>
                <span className="text-body leading-[1.45] font-bold text-text-primary">{q.title}</span>
              </label>
              <div
                className={`flex items-end gap-2 rounded-input border bg-bg-surface pt-3 pr-3 pb-2.5 pl-4 ${
                  recordingThis ? 'border-primary-strong ring-[0.5px] ring-primary-strong' : 'border-line-strong focus-within:border-primary-strong'
                }`}
              >
                <textarea
                  id={`answer-${q.key}`}
                  ref={(el) => {
                    textareaRefs.current[q.key] = el;
                  }}
                  value={draft.profile[q.key]}
                  onChange={(e) => setAnswer(q.key, e.target.value)}
                  placeholder={q.placeholder}
                  rows={2}
                  maxLength={MAX_ANSWER}
                  className="min-h-10 flex-1 resize-none bg-transparent text-[14px] leading-[1.45] text-text-primary [field-sizing:content] placeholder:text-text-tertiary focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => toggleMic(q.key)}
                  disabled={transcribing || (isRecording && !isActive)}
                  aria-label={recordingThis ? `${q.title} 녹음 끝내기` : `${q.title} 말로 입력하기`}
                  aria-pressed={recordingThis}
                  className={`flex size-8 shrink-0 items-center justify-center rounded-full transition-colors disabled:opacity-40 ${
                    recordingThis ? 'animate-pulse bg-primary-strong text-text-on-primary' : 'bg-primary-soft text-primary-strong'
                  }`}
                >
                  <MicIcon size={16} />
                </button>
              </div>
              {(recordingThis || transcribingThis) && (
                <p className="text-caption text-primary-strong" role="status">
                  {transcribingThis ? '말씀하신 내용을 글로 바꾸고 있어요.' : '듣고 있어요. 다 말씀하시면 마이크를 다시 눌러 주세요.'}
                </p>
              )}
            </div>
          );
        })}
      </div>

      <MicPermissionSheet
        open={permissionOpen}
        onClose={() => setPermissionOpen(false)}
        onTypeInstead={() => {
          setPermissionOpen(false);
          textareaRefs.current[activeKeyRef.current ?? 'Q1']?.focus();
        }}
      />
    </OnboardingShell>
  );
}

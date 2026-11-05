// src/app/diary/new/page.tsx
// 2.1 돌봄 일기 작성 (2.4 기록 목록의 "새 기록"·"첫 기록 작성하기"에서 들어옴)
//   - 기본           Figma node 35:2302
//   - [예외] 녹음 권한 거부   Figma node 35:2400 (MicPermissionSheet)
//   - [예외] 일기 입력 없음   Figma node 35:2472
//
// 흐름: 녹음 버튼 → 녹음 중(타이머) → 다시 누르면 종료 → 텍스트 변환(STT) → 입력창에 추가
//       → 직접 수정 가능 → "AI로 분석하기"
// 녹음 없이 텍스트만 입력해도 분석할 수 있습니다.
// 주소에 params/searchParams가 없어 loading.tsx는 필요 없습니다.

'use client';

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';

import Button from '@/components/common/Button';
import Chip from '@/components/common/Chip';
import Header from '@/components/common/Header';
import MicPermissionSheet from '@/components/diary/MicPermissionSheet';
import { InfoIcon, MicIcon, MicOffIcon } from '@/components/icons/Icons';
import { useRecorder, type RecorderError } from '@/hooks/useRecorder';
import { requestDiaryAnalysis, transcribeAudio } from '@/lib/api/diary';
import { formatKoreanDate } from '@/lib/date';

const MAX_LENGTH = 1000;

// TODO: 온보딩에서 저장한 아이 이름으로 교체
const CHILD_NAME = '민준';

// useSyncExternalStore용: 날짜는 화면에 있는 동안 바뀔 일이 없어 구독할 것이 없음
const subscribeNothing = () => () => {};
const getTodayLabel = () => formatKoreanDate(new Date());
const getNoLabel = () => null;

function formatTime(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// 권한 거부는 바텀시트로 안내하므로 여기엔 없음
const RECORDER_ERROR_MESSAGE: Partial<Record<RecorderError, string>> = {
  'no-device': '사용할 수 있는 마이크를 찾지 못했어요.',
  insecure: '보안 연결(https)에서만 녹음할 수 있어요.',
  unsupported: '이 브라우저에서는 녹음을 지원하지 않아요.',
  unknown: '녹음을 시작하지 못했어요. 다시 시도해 주세요.',
};

export default function DiaryWritePage() {
  const router = useRouter();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 날짜는 브라우저에서만 계산 (서버에서는 null → 서버 시간대와 달라지는 것 방지)
  const today = useSyncExternalStore(subscribeNothing, getTodayLabel, getNoLabel);
  const [content, setContent] = useState('');
  const [fromRecording, setFromRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [sttFailed, setSttFailed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitFailed, setSubmitFailed] = useState(false);
  const [showEmptyError, setShowEmptyError] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);


  const handleRecorded = useCallback(async (audio: Blob) => {
    setTranscribing(true);
    setSttFailed(false);
    try {
      const { text } = await transcribeAudio(audio);
      // 이미 쓴 내용이 있으면 이어 붙임
      setContent((prev) => (prev.trim() ? `${prev.trim()}\n${text}` : text).slice(0, MAX_LENGTH));
      setFromRecording(true);
      setShowEmptyError(false);
    } catch {
      setSttFailed(true);
    } finally {
      setTranscribing(false);
    }
  }, []);

  const recorder = useRecorder({ onComplete: handleRecorded });
  const isRecording = recorder.status === 'recording';
  const busy = recorder.status === 'requesting' || transcribing || submitting;

  // 권한 거부 또는 녹음 불가 환경 → 마이크 회색 상태
  const permissionDenied =
    recorder.error === 'permission-denied' ||
    (recorder.permission === 'denied' && !isRecording);
  const micUnavailable =
    permissionDenied ||
    recorder.error === 'unsupported' ||
    recorder.error === 'insecure' ||
    recorder.error === 'no-device';

  const isEmpty = !content.trim();

  const focusTextarea = () => {
    textareaRef.current?.focus();
    textareaRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' });
  };

  const handleMicClick = async () => {
    if (isRecording) {
      recorder.stop();
      return;
    }
    // 이미 거부된 상태면 브라우저가 다시 묻지 않으므로 바로 안내
    if (permissionDenied) {
      setSheetOpen(true);
      return;
    }
    const error = await recorder.start();
    if (error === 'permission-denied') setSheetOpen(true);
  };

  const handleAnalyze = async () => {
    setSubmitting(true);
    setSubmitFailed(false);
    try {
      const { diaryId } = await requestDiaryAnalysis({
        content: content.trim(),
        audio: recorder.audio,
      });
      router.push(`/diary/${diaryId}/result`);
    } catch {
      setSubmitFailed(true);
      setSubmitting(false);
    }
  };

  // 비활성 상태의 분석 버튼을 눌렀을 때: 입력이 비어 있으면 안내
  const handleDisabledAnalyzeTap = () => {
    if (isEmpty && !busy && !isRecording) {
      setShowEmptyError(true);
      focusTextarea();
    }
  };

  let statusText = '눌러서 녹음을 시작하세요';
  if (micUnavailable) statusText = '녹음을 사용할 수 없어요';
  else if (recorder.status === 'requesting') statusText = '마이크 연결 중…';
  else if (isRecording) statusText = `녹음 중 · ${formatTime(recorder.seconds)}`;
  else if (transcribing) statusText = '텍스트로 바꾸는 중…';
  else if (recorder.status === 'stopped') statusText = `녹음 완료 · ${formatTime(recorder.seconds)}`;

  const errorText =
    (recorder.error && RECORDER_ERROR_MESSAGE[recorder.error]) ||
    (sttFailed && '텍스트로 바꾸지 못했어요. 다시 녹음하거나 직접 입력해 주세요.') ||
    null;

  const inputBorder = showEmptyError
    ? 'border-[1.5px] border-pink-strong'
    : !isEmpty
      ? 'border-[1.5px] border-primary-base'
      : 'border border-line-strong focus-within:border-primary-base';

  const analyzeDisabled = isEmpty || busy || isRecording;

  // 개발 중 녹음 확인용 재생 주소
  const audioUrl = useMemo(
    () => (recorder.audio ? URL.createObjectURL(recorder.audio) : null),
    [recorder.audio],
  );
  useEffect(() => {
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  return (
    // 위쪽 70px + Header 안쪽 24px = Figma 제목 위치 94px (하단 탭 첫 화면이라 뒤로가기 없음)
    <main className="mx-auto flex min-h-dvh w-full max-w-[390px] flex-col bg-bg-base pt-[70px] pb-[104px]">
      <Header title="오늘의 돌봄 기록" subtitle="음성 또는 텍스트로 자유롭게 기록해 보세요" />

      <div className="flex flex-1 flex-col px-6">
      {/* 날짜 */}
      <div className="mt-2 h-[26px]">{today && <Chip tone="primary">{today}</Chip>}</div>

      {/* 녹음 영역 */}
      <section className="mt-1.5 flex flex-col items-center" aria-label="음성 녹음">
        <div className="relative flex size-[150px] items-center justify-center">
          <span
            aria-hidden
            className={`absolute inset-0 rounded-full ${micUnavailable ? 'bg-bg-subtle' : 'bg-primary-soft'} ${
              isRecording ? 'animate-pulse' : ''
            }`}
          />
          <span
            aria-hidden
            className={`absolute inset-[15px] rounded-full ${
              micUnavailable ? 'bg-primary-base/40' : 'bg-primary-base/60'
            } ${isRecording ? 'animate-pulse' : ''}`}
          />
          <button
            type="button"
            onClick={handleMicClick}
            disabled={busy}
            aria-pressed={isRecording}
            aria-label={
              micUnavailable ? '녹음을 사용할 수 없어요' : isRecording ? '녹음 멈추기' : '녹음 시작하기'
            }
            className={`relative flex size-[92px] items-center justify-center rounded-full text-text-on-primary transition-transform active:scale-95 disabled:opacity-60 ${
              micUnavailable ? 'bg-line-strong' : 'bg-primary-strong'
            }`}
          >
            {micUnavailable ? <MicOffIcon size={40} /> : <MicIcon size={40} />}
          </button>
        </div>

        <p
          className={`mt-3 text-center text-body leading-[1.45] font-bold ${
            micUnavailable ? 'text-text-tertiary' : 'text-primary-strong'
          }`}
          aria-live="polite"
        >
          {statusText}
        </p>
        {errorText && (
          <p className="mt-1 text-center text-caption text-pink-strong" role="alert">
            {errorText}
          </p>
        )}
        {process.env.NODE_ENV === 'development' && audioUrl && (
          <div className="mt-2 w-full">
            <audio controls src={audioUrl} className="w-full" />
            <p className="mt-1 text-micro text-text-tertiary">[개발용] 형식: {recorder.audio?.type}</p>
          </div>
        )}
      </section>

      {/* 입력 */}
      <section className="mt-3 flex flex-col gap-[10px]">
        <div className="flex items-center gap-[10px]" aria-hidden>
          <span className="h-px flex-1 bg-line-strong" />
          <span className="text-micro leading-[1.45] font-medium text-text-tertiary">
            {fromRecording ? '변환된 텍스트 · 직접 수정 가능' : '또는 직접 입력하기'}
          </span>
          <span className="h-px flex-1 bg-line-strong" />
        </div>

        <div
          className={`flex flex-col gap-2 rounded-button bg-bg-surface px-4 pt-[14px] pb-3 ${inputBorder}`}
        >
          <label htmlFor="diary-content" className="sr-only">
            돌봄 기록 내용
          </label>
          <textarea
            ref={textareaRef}
            id="diary-content"
            value={content}
            onChange={(e) => {
              setContent(e.target.value.slice(0, MAX_LENGTH));
              if (showEmptyError) setShowEmptyError(false);
            }}
            maxLength={MAX_LENGTH}
            rows={4}
            placeholder={`오늘 ${CHILD_NAME}이의 하루를 기록해 주세요.`}
            aria-invalid={showEmptyError}
            aria-describedby={showEmptyError ? 'diary-empty-error' : undefined}
            className="w-full resize-none bg-transparent text-body leading-[1.55] text-text-primary placeholder:text-text-tertiary focus:outline-none"
          />
          <p className="text-right text-micro leading-[1.45] text-text-tertiary">
            {content.length} / {MAX_LENGTH}
          </p>
        </div>

        {showEmptyError && (
          <p
            id="diary-empty-error"
            role="alert"
            className="flex items-center gap-1.5 text-caption leading-[1.45] font-medium text-pink-strong"
          >
            <InfoIcon size={16} />
            기록을 먼저 작성해 주세요
          </p>
        )}
      </section>

      {/* 분석 버튼: 남는 공간 아래쪽에 붙임 */}
      <div className="mt-auto pt-6">
        {submitFailed && (
          <p className="mb-2 text-center text-caption text-pink-strong" role="alert">
            분석 요청에 실패했어요. 잠시 후 다시 시도해 주세요.
          </p>
        )}
        {analyzeDisabled ? (
          // 비활성 버튼은 클릭 이벤트가 없어서, 감싼 영역이 대신 눌림을 받음
          <div onClick={handleDisabledAnalyzeTap}>
            <Button disabled className="pointer-events-none">
              {submitting ? '분석 요청 중…' : 'AI로 분석하기'}
            </Button>
          </div>
        ) : (
          <Button onClick={handleAnalyze}>AI로 분석하기</Button>
        )}
      </div>

      </div>

      <MicPermissionSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onTypeInstead={() => {
          setSheetOpen(false);
          focusTextarea();
        }}
      />
    </main>
  );
}

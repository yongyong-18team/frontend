// src/hooks/useRecorder.ts
// 브라우저 녹음 훅 (MediaRecorder)
//
// - 브라우저마다 지원 형식이 달라서 가능한 형식을 자동으로 고릅니다.
//   (크롬·안드로이드: webm / 아이폰 Safari: mp4)
// - 녹음이 끝나면 onComplete(녹음 파일)를 한 번 호출합니다.
// - 화면을 떠나거나 앱이 백그라운드로 가면 녹음을 멈춥니다.
// - 마이크 권한이 거부돼 있으면 permission이 'denied'가 되고,
//   사용자가 설정에서 허용으로 바꾸면 자동으로 다시 쓸 수 있는 상태가 됩니다.
// - 마이크는 https 또는 localhost에서만 동작합니다.

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export type RecorderStatus = 'idle' | 'requesting' | 'recording' | 'stopped' | 'error';
export type RecorderError =
  | 'unsupported'
  | 'insecure'
  | 'permission-denied'
  | 'no-device'
  | 'unknown';
export type MicPermission = 'granted' | 'denied' | 'prompt' | 'unknown';

const MIME_CANDIDATES = [
  'audio/webm;codecs=opus',
  'audio/webm',
  'audio/mp4',
  'audio/ogg;codecs=opus',
];

function pickMimeType() {
  if (typeof MediaRecorder === 'undefined') return undefined;
  return MIME_CANDIDATES.find((type) => MediaRecorder.isTypeSupported(type));
}

type Options = {
  /** 최대 녹음 길이(초). 넘으면 자동 종료. TODO(백엔드 B): 서버 허용 길이 확인 */
  maxSeconds?: number;
  onComplete?: (audio: Blob, seconds: number) => void;
};

export function useRecorder({ maxSeconds = 300, onComplete }: Options = {}) {
  const [status, setStatus] = useState<RecorderStatus>('idle');
  const [error, setError] = useState<RecorderError | null>(null);
  const [permission, setPermission] = useState<MicPermission>('unknown');
  const [seconds, setSeconds] = useState(0);
  const [audio, setAudio] = useState<Blob | null>(null);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const startedAtRef = useRef(0);
  const secondsRef = useRef(0);
  const errorRef = useRef<RecorderError | null>(null);

  const onCompleteRef = useRef(onComplete);
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  const fail = useCallback((reason: RecorderError) => {
    errorRef.current = reason;
    setError(reason);
    setStatus('error');
    return reason;
  }, []);

  const clearError = useCallback(() => {
    errorRef.current = null;
    setError(null);
  }, []);

  // 마이크 권한 상태 확인 + 변경 감지 (지원하지 않는 브라우저는 'unknown')
  useEffect(() => {
    let permissionStatus: PermissionStatus | null = null;
    let cancelled = false;

    const sync = () => {
      if (!permissionStatus) return;
      const state = permissionStatus.state as MicPermission;
      setPermission(state);
      // 설정에서 허용으로 바꾸고 돌아오면 다시 녹음 가능한 상태로
      if (state === 'granted' && errorRef.current === 'permission-denied') {
        errorRef.current = null;
        setError(null);
        setStatus('idle');
      }
    };

    navigator.permissions
      ?.query({ name: 'microphone' as PermissionName })
      .then((result) => {
        if (cancelled) return;
        permissionStatus = result;
        sync();
        result.addEventListener('change', sync);
      })
      .catch(() => {
        /* Firefox 등 일부 브라우저는 microphone 조회 미지원 */
      });

    return () => {
      cancelled = true;
      permissionStatus?.removeEventListener('change', sync);
    };
  }, []);

  const releaseMic = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  const stop = useCallback(() => {
    const recorder = recorderRef.current;
    if (recorder && recorder.state !== 'inactive') recorder.stop();
  }, []);

  /** 녹음 시작. 실패하면 오류 종류를, 성공하면 null을 돌려줍니다. */
  const start = useCallback(async (): Promise<RecorderError | null> => {
    clearError();

    if (!window.isSecureContext) return fail('insecure');
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      return fail('unsupported');
    }

    setStatus('requesting');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      setPermission('granted');

      const mimeType = pickMimeType();
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      recorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        releaseMic();
        const blob = new Blob(chunksRef.current, {
          type: recorder.mimeType || mimeType || 'audio/webm',
        });
        setAudio(blob);
        setStatus('stopped');
        onCompleteRef.current?.(blob, secondsRef.current);
      };

      recorder.start(1000); // 1초마다 조각 저장 → 중간에 끊겨도 앞부분은 남음
      startedAtRef.current = Date.now();
      secondsRef.current = 0;
      setSeconds(0);
      setAudio(null);
      setStatus('recording');

      timerRef.current = window.setInterval(() => {
        const elapsed = Math.floor((Date.now() - startedAtRef.current) / 1000);
        secondsRef.current = elapsed;
        setSeconds(elapsed);
        if (elapsed >= maxSeconds) stop();
      }, 250);
      return null;
    } catch (e) {
      releaseMic();
      const name = e instanceof DOMException ? e.name : '';
      if (name === 'NotAllowedError' || name === 'SecurityError') {
        setPermission('denied');
        return fail('permission-denied');
      }
      return fail(name === 'NotFoundError' ? 'no-device' : 'unknown');
    }
  }, [clearError, fail, maxSeconds, releaseMic, stop]);

  // 전화가 오거나 다른 앱으로 가면 지금까지 녹음한 것까지 저장하고 멈춤
  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState === 'hidden') stop();
    };
    document.addEventListener('visibilitychange', onHide);
    return () => document.removeEventListener('visibilitychange', onHide);
  }, [stop]);

  // 화면을 떠나면 마이크 끄기 (녹음 결과는 버림)
  useEffect(() => {
    return () => {
      const recorder = recorderRef.current;
      if (recorder && recorder.state !== 'inactive') {
        recorder.onstop = null;
        recorder.stop();
      }
      releaseMic();
    };
  }, [releaseMic]);

  return { status, error, permission, seconds, audio, start, stop };
}

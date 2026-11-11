// src/lib/diary/writeDraft.ts
// 2.1 작성 중인 기록 임시 저장 (PRD 5-5 "오류 발생 시 기존 입력 유지")
// - 쓰다가 로그인이 만료돼 로그인 화면으로 가도, 다시 로그인해서 2.1로 돌아오면 그대로 채워 줌
// - sessionStorage: 이 탭에서만 남고 탭을 닫으면 지워짐 (일기 원문이라 오래 남기지 않음)
// - 대상자 ID를 같이 저장해서 다른 계정·다른 대상자에게는 보이지 않게 함
// - 저장(DIARY-01)에 성공하면 지움

import { getSubjectId } from '@/lib/auth/session';

const KEY = 'yongyong.diaryWriteDraft';

export type WriteDraft = { content: string; fromRecording: boolean };

export function loadWriteDraft(): WriteDraft | null {
  if (typeof window === 'undefined') return null;
  try {
    const saved = JSON.parse(window.sessionStorage.getItem(KEY) ?? 'null') as
      | (WriteDraft & { subjectId: number | null })
      | null;
    if (!saved || !saved.content?.trim() || saved.subjectId !== getSubjectId()) return null;
    return { content: saved.content, fromRecording: !!saved.fromRecording };
  } catch {
    return null;
  }
}

export function saveWriteDraft(draft: WriteDraft) {
  if (typeof window === 'undefined') return;
  try {
    if (!draft.content.trim()) window.sessionStorage.removeItem(KEY);
    else window.sessionStorage.setItem(KEY, JSON.stringify({ ...draft, subjectId: getSubjectId() }));
  } catch {
    /* 저장이 막혀 있으면 임시 저장 없이 동작 */
  }
}

export function clearWriteDraft() {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.removeItem(KEY);
  } catch {
    /* 무시 */
  }
}

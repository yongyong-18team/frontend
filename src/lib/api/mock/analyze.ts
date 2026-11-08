// src/lib/api/mock/analyze.ts
// "AI 분석(DIARY-02)" 흉내: 일기를 문장으로 나누고, 문장 속 단어로 분류해 명세 형식의 항목을 만듭니다.
// 실제 AI가 아니라 단어 규칙이라 정확하지 않습니다. 백엔드를 연결하면 mock 폴더째 지웁니다.

import type { AnalyzeResultType, DiaryItem, GuideSection, ItemCategory, TimeSlot } from '@/lib/api/diary';

const CRISIS_WORDS = ['죽고싶', '자살', '자해', '사라지고싶', '살기싫', '죽어버리', '죽을래', '극단적'];
const BURNOUT_WORDS = ['지쳐', '지친', '지치', '힘들어', '힘들다', '버겁', '번아웃', '못버티'];

const TRIGGER_WORDS = ['소리가나', '소리가났', '공사', '사람이많', '낯선', '바뀌', '시끄러', '갑자기'];
const COPING_WORDS = ['진정', '안정', '괜찮아졌', '좋아졌', '나아졌', '도움이', '효과', '틀어주', '들려주', '안아주', '달래', '차분해', '가라앉', '풀렸'];
const BEHAVIOR_LABELS: [string[], string][] = [
  [['소리를지르', '소리를질', '소리질'], '소리 지름'],
  [['귀를막'], '귀 막기'],
  [['울었', '울음', '울기', '울며', '울어'], '울음'],
  [['때렸', '때리'], '때림'],
  [['던졌', '던지'], '물건 던짐'],
  [['깨물'], '깨물기'],
  [['떼를', '떼쓰'], '떼쓰기'],
  [['짜증'], '짜증'],
  [['거부'], '거부'],
  [['불안'], '불안'],
  [['도망', '뛰쳐'], '이탈'],
  [['화를', '화가', '흥분', '공격'], '흥분'],
];
const MEDICATION_WORDS = ['약을', '약먹', '복약', '약은'];
const HEALTH_RISK_WORDS = ['열이', '기침', '아프', '병원', '알레르기', '다쳤'];
const DAILY_WORDS = ['낮잠', '잠을', '잠들', '못잤', '식사', '밥을', '먹었', '안먹', '먹지않', '변비', '컨디션', '피로', '산책'];
const PREFERENCE_WORDS = ['좋아하', '좋아했', '싫어하', '싫어했', '즐거', '재미있'];

const TIME_WORDS: [string[], TimeSlot][] = [
  [['새벽', '밤에', '밤새', '자기전'], 'NIGHT'],
  [['아침', '오전'], 'MORNING'],
  [['점심', '오후', '낮에'], 'AFTERNOON'],
  [['저녁'], 'EVENING'],
];

const MAX_ITEMS = 5;
const CONTENT_MAX = 40;

const compact = (s: string) => s.replace(/\s+/g, '');
const hasAny = (text: string, words: string[]) => words.some((w) => text.includes(w));

export function isCrisisText(content: string) {
  return hasAny(compact(content), CRISIS_WORDS);
}

function splitSentences(content: string) {
  return content
    .split(/(?<=[.!?。…])\s*|\n+/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 4);
}

/** "큰 소리가 나자 귀를 막았어요" → ["큰 소리가 나자", "귀를 막았어요"] */
function splitCause(sentence: string): [string, string] | null {
  const m = sentence.match(/^(.+?(?:나자|하자|되자|가자|오자|니까|더니|는데))\s+(.+)$/);
  return m ? [m[1], m[2]] : null;
}

function findTimeSlot(text: string): TimeSlot | null {
  const t = compact(text);
  for (const [words, slot] of TIME_WORDS) if (hasAny(t, words)) return slot;
  return null;
}

function findDuration(text: string): number | null {
  const hour = text.match(/(\d+)\s*시간/);
  if (hour) return Number(hour[1]) * 60;
  const min = text.match(/(\d+)\s*분/);
  return min ? Number(min[1]) : null;
}

function toContent(text: string) {
  const s = text
    .replace(/[.!?。…\s]+$/, '')
    .replace(/^(오늘|오늘은)\s*/, '')
    .trim();
  return s.length > CONTENT_MAX ? `${s.slice(0, CONTENT_MAX)}…` : s;
}

type Draft = { category: ItemCategory; section: GuideSection; label: string | null; text: string };

function classify(text: string, allowTrigger: boolean): Draft | null {
  const t = compact(text);
  if (hasAny(t, COPING_WORDS)) return { category: 'COPING', section: 'BEHAVIOR_RESPONSE', label: null, text };
  const behavior = BEHAVIOR_LABELS.find(([words]) => hasAny(t, words));
  if (behavior) return { category: 'BEHAVIOR', section: 'BEHAVIOR_RESPONSE', label: behavior[1], text };
  if (allowTrigger && hasAny(t, TRIGGER_WORDS)) return { category: 'TRIGGER', section: 'BEHAVIOR_RESPONSE', label: null, text };
  if (hasAny(t, MEDICATION_WORDS)) return { category: 'HEALTH', section: 'MEDICATION', label: null, text };
  if (hasAny(t, HEALTH_RISK_WORDS)) return { category: 'HEALTH', section: 'HEALTH_RISK', label: null, text };
  if (hasAny(t, DAILY_WORDS)) return { category: 'HEALTH', section: 'DAILY_LIFE', label: null, text };
  if (hasAny(t, PREFERENCE_WORDS)) return { category: 'PREFERENCE', section: 'PREFERENCE', label: null, text };
  return null;
}

export type MockAnalysis = {
  result: AnalyzeResultType;
  empathyText: string | null;
  items: DiaryItem[];
  burnoutNotice: boolean;
  /** "#실패" → AI_TIMEOUT 흉내 */
  fail: boolean;
};

export function analyzeContent(content: string): MockAnalysis {
  if (content.includes('#실패')) {
    return { result: 'NO_ITEMS', empathyText: null, items: [], burnoutNotice: false, fail: true };
  }
  if (isCrisisText(content)) {
    return { result: 'CRISIS', empathyText: null, items: [], burnoutNotice: false, fail: false };
  }

  const diaryTimeSlot = findTimeSlot(content);
  const drafts: { draft: Draft; sentence: string; episodeNo: number }[] = [];

  splitSentences(content).forEach((sentence, i) => {
    const parts = splitCause(sentence);
    if (parts) {
      const cause = classify(parts[0], true);
      const effect = classify(parts[1], false);
      if (cause) drafts.push({ draft: cause, sentence, episodeNo: i + 1 });
      if (effect) drafts.push({ draft: effect, sentence, episodeNo: i + 1 });
      if (cause || effect) return;
    }
    const whole = classify(sentence, true);
    if (whole) drafts.push({ draft: whole, sentence, episodeNo: i + 1 });
  });

  const items: DiaryItem[] = drafts.slice(0, MAX_ITEMS).map(({ draft, sentence, episodeNo }, i) => ({
    itemNo: i + 1,
    category: draft.category,
    section: draft.section,
    label: draft.label,
    content: toContent(draft.text),
    timeSlot: findTimeSlot(sentence) ?? diaryTimeSlot,
    durationMin: draft.category === 'BEHAVIOR' || draft.category === 'COPING' ? findDuration(draft.text) : null,
    episodeNo,
    evidenceQuote: draft.text.replace(/[.!?。…\s]+$/, ''),
    status: 'PENDING',
  }));

  const has = (c: ItemCategory) => items.some((it) => it.category === c);
  let empathyText: string;
  if (has('BEHAVIOR') && has('COPING')) {
    empathyText = '힘든 순간에도 잘 대처하셨네요.\n이런 경험이 쌓여 돌봄 설명서가 돼요.';
  } else if (has('BEHAVIOR') || has('TRIGGER')) {
    empathyText = '오늘 많이 신경 쓰이셨겠어요.\n기록해 주신 내용이 다음 대처에 도움이 될 거예요.';
  } else if (has('COPING')) {
    empathyText = '좋은 방법을 찾으셨네요.\n작은 변화도 소중한 돌봄 정보가 돼요.';
  } else if (items.length > 0) {
    empathyText = '오늘도 세심하게 살펴보셨네요.\n작은 변화도 소중한 돌봄 정보가 돼요.';
  } else {
    empathyText = '기록해 주셔서 고마워요.';
  }

  return {
    result: items.length > 0 ? 'REVIEW' : 'NO_ITEMS',
    empathyText,
    items,
    burnoutNotice: hasAny(compact(content), BURNOUT_WORDS),
    fail: false,
  };
}

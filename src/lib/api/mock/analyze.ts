// src/lib/api/mock/analyze.ts
// "AI 분석" 흉내: 일기를 문장으로 나누고, 문장 속 단어로 분류합니다.
// 실제 AI가 아니라 단어 목록 규칙이라 정확하지 않습니다. 백엔드를 연결하면 이 파일은 지웁니다.
//
// 시험용
//   - "죽고 싶다", "자해" 같은 표현 → 위기(CRISIS) → 5.5로 이동
//   - 일기에 "#실패" 를 넣으면 → 분석 실패 화면

import type { ExtractedCategory, ExtractedItem, RiskLevel } from '@/lib/api/diary';

const CRISIS_WORDS = ['죽고싶', '자살', '자해', '사라지고싶', '살기싫', '죽어버리', '죽을래', '극단적'];

// 위에서부터 먼저 맞는 분류로 정함 (대처 방법이 행동보다 우선: "동요를 들려주니 진정했어요" → 대처)
const RULES: { category: ExtractedCategory; words: string[] }[] = [
  {
    category: 'COPING',
    words: ['진정', '안정', '괜찮아졌', '좋아졌', '나아졌', '도움이', '효과', '틀어주', '들려주', '안아주', '달래', '차분해', '가라앉', '풀렸'],
  },
  {
    category: 'BEHAVIOR',
    words: ['소리를지르', '소리질', '울었', '울음', '울기', '떼를', '떼쓰', '때렸', '때리', '던졌', '던지', '깨물', '귀를막', '짜증', '불안', '거부', '도망', '뛰쳐', '반복', '멈추지', '화를', '화가', '흥분', '공격'],
  },
  {
    category: 'HEALTH',
    words: ['약을', '복약', '약먹', '열이', '기침', '낮잠', '잠을', '잠들', '못잤', '식사', '밥을', '먹었', '안먹', '먹지않', '변비', '아프', '병원', '컨디션', '피로'],
  },
  {
    category: 'PREFERENCE',
    words: ['좋아하', '싫어하', '즐거', '재미있', '관심'],
  },
];

const MAX_ITEMS = 4;
const SUMMARY_MAX = 24;

const compact = (s: string) => s.replace(/\s+/g, '');

function splitSentences(content: string) {
  return content
    .split(/(?<=[.!?。…])\s*|\n+/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 4);
}

function classify(sentence: string): ExtractedCategory | null {
  const text = compact(sentence);
  for (const rule of RULES) {
    if (rule.words.some((w) => text.includes(w))) return rule.category;
  }
  return null;
}

/** 원문 문장을 한 줄 요약처럼 다듬기 */
function toSummary(sentence: string) {
  const s = sentence.replace(/[.!?。…\s]+$/, '').replace(/^(오늘|오늘은)\s*/, '');
  return s.length > SUMMARY_MAX ? `${s.slice(0, SUMMARY_MAX)}…` : s;
}

export function isCrisisText(content: string) {
  const text = compact(content);
  return CRISIS_WORDS.some((w) => text.includes(w));
}

export type MockAnalysis = {
  riskLevel: RiskLevel;
  empathyMessage: string;
  items: ExtractedItem[];
  failed: boolean;
};

export function analyzeDiary(content: string, idPrefix: string): MockAnalysis {
  if (content.includes('#실패')) {
    return { riskLevel: 'NONE', empathyMessage: '', items: [], failed: true };
  }
  if (isCrisisText(content)) {
    return { riskLevel: 'CRISIS', empathyMessage: '', items: [], failed: false };
  }

  const items: ExtractedItem[] = [];
  for (const sentence of splitSentences(content)) {
    const category = classify(sentence);
    if (!category) continue;
    items.push({
      id: `${idPrefix}-item-${items.length + 1}`,
      category,
      summary: toSummary(sentence),
      quote: sentence,
    });
    if (items.length >= MAX_ITEMS) break;
  }

  const has = (c: ExtractedCategory) => items.some((i) => i.category === c);
  let empathyMessage: string;
  if (has('BEHAVIOR') && has('COPING')) {
    empathyMessage = '힘든 순간에도 잘 대처하셨네요.\n이런 경험이 쌓여 돌봄 설명서가 돼요.';
  } else if (has('BEHAVIOR')) {
    empathyMessage = '오늘 많이 힘드셨겠어요.\n기록해 주신 내용이 다음 대처에 도움이 될 거예요.';
  } else if (has('COPING')) {
    empathyMessage = '좋은 방법을 찾으셨네요.\n작은 변화도 소중한 돌봄 정보가 돼요.';
  } else if (items.length > 0) {
    empathyMessage = '오늘도 세심하게 살펴보셨네요.\n작은 변화도 소중한 돌봄 정보가 돼요.';
  } else {
    empathyMessage = '기록해 주셔서 고마워요.\n조금 더 자세히 적어 주시면 정리해 드릴게요.';
  }

  return { riskLevel: 'NONE', empathyMessage, items, failed: false };
}

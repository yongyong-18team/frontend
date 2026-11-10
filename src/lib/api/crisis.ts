// src/lib/api/crisis.ts
// 5.5 위기 안전 안내 (API 명세 SUP-02, 로그인 필요)
//   - 안내 문구·연락처는 서버의 고정 문구(LLM 생성 아님)를 받아 보여줍니다.
//   - 이 화면은 서버가 늦거나 실패해도 바로 떠야 해서, 같은 내용을 CRISIS_FALLBACK으로 들고 있다가
//     서버 응답이 오면 바꿔 끼웁니다. (문구: 기획 문구 확정안 v1.4 5.5 = 명세 SUP-02 예시)
// NEXT_PUBLIC_REAL_API에 crisis가 있으면 실제 서버, 없으면 아래 고정 내용 (realApi.ts 참고)

import { api } from '@/lib/api/client';
import { isReal } from '@/lib/api/realApi';

export type CrisisContact = {
  name: string;
  phone: string;
  /** 예: "24시간" (상담 전화) */
  hours?: string;
  /** 예: "지금 누군가 다쳤거나 위험할 때" (119·112) */
  note?: string;
};

/** SUP-02 응답 */
export type CrisisGuide = {
  message: string[];
  contacts: CrisisContact[];
  /** "조금 진정된 뒤" 안내할 지원 (5.3 상세로 연결) */
  followUp: { resourceId: number; name: string } | null;
};

export const CRISIS_FALLBACK: CrisisGuide = {
  message: ['지금 많이 힘드신 것 같아요.', '혼자 감당하지 않으셔도 됩니다. 지금 바로 이야기할 수 있는 곳이 있어요.'],
  contacts: [
    { name: '자살예방 상담전화', phone: '109', hours: '24시간' },
    { name: '정신건강 위기상담', phone: '1577-0199', hours: '24시간' },
    { name: '119', phone: '119', note: '지금 누군가 다쳤거나 위험할 때' },
    { name: '112', phone: '112', note: '지금 누군가 다쳤거나 위험할 때' },
  ],
  followUp: { resourceId: 1101, name: '발달장애인 부모상담 지원' },
};

/** SUP-02. 실패하면 호출한 쪽에서 CRISIS_FALLBACK을 그대로 씀 */
export async function getCrisisGuide(): Promise<CrisisGuide> {
  if (isReal('crisis')) return api.get<CrisisGuide>('/support/crisis-guide', { timeoutMs: 5000 });
  return CRISIS_FALLBACK;
}

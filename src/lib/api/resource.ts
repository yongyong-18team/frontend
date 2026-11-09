// src/lib/api/resource.ts
// 돌봄 지원 API (API 명세 2-9 RES-01·02, SUP-01, 백엔드 C)
//
// 지금은 src/mocks/resource.ts·support.ts 데이터로 동작합니다.
// 백엔드 연결 시: 각 함수의 "가짜 응답" 부분을 지우고 주석 처리된 실제 요청을 살리면 됩니다.

import { ApiError, api, subjectPath } from '@/lib/api/client';
import * as mock from '@/lib/api/mock/store';
import type { District } from '@/constants/labels';
import { getSubject } from '@/lib/api/guide';
import { mockResourceDetail, mockSearchResources } from '@/mocks/resource';
import { mockCaregiverSupport } from '@/mocks/support';

void api;
void subjectPath;

/* ───────────── 타입 (Swagger 그대로) ───────────── */

export type CareTerm = 'SHORT' | 'LONG';
export type ResourceKind = 'FACILITY' | 'PROGRAM';
export type ProgramType = 'EMERGENCY_CARE' | 'DAY_ACTIVITY' | 'ACTIVITY_SUPPORT' | 'FAMILY_REST' | 'PARENT_COUNSELING';

/** RES-02 조건 (5.1 → 5.2로 넘기는 값, 저장 안 함). district 생략 = 대상자 등록 지역 */
export type ResourceSearchQuery = {
  careTerm?: CareTerm;
  neededDate?: string; // yyyy-MM-dd
  district?: District;
  dong?: string;
  kind?: ResourceKind;
};

export type ResourceResult =
  | { resourceId: number; kind: 'PROGRAM'; name: string; summary: string; reasonText: string; officialUrl: string }
  | { resourceId: number; kind: 'FACILITY'; name: string; district: District; phone: string; reasonText: string; officialUrl: string };

/** RES-02 응답 (condition.district = 실제로 적용한 지역) */
export type ResourceSearchResponse = {
  condition: { careTerm: CareTerm | null; neededDate: string | null; district: District; dong: string | null };
  disclaimer: string;
  results: ResourceResult[];
};

/** RES-01 응답 (시설 / 제도) */
export type ResourceDetail =
  | {
      resourceId: number;
      kind: 'FACILITY';
      name: string;
      phone: string;
      officialUrl: string;
      facilityType: string;
      district: District;
      address: string;
      services: string;
      source: string;
      fetchedAt: string;
    }
  | {
      resourceId: number;
      kind: 'PROGRAM';
      name: string;
      phone: string;
      officialUrl: string;
      programType: ProgramType | string;
      careTerm: CareTerm | 'BOTH' | null;
      summary: string;
      eligibilitySummary: string;
      procedure: string;
      sourceDoc: string;
      docVersion: string;
    };

/** SUP-01 응답 */
export type BurnoutGuide = {
  message: string[];
  programs: { resourceId: number; name: string; programType: ProgramType | string }[];
};

/* ───────────── API ───────────── */

/** RES-02 조건으로 기관·제도 검색 (결과 없으면 빈 배열) */
export async function searchResources(query: ResourceSearchQuery): Promise<ResourceSearchResponse> {
  // return api.get<ResourceSearchResponse>(subjectPath('/resources/search'), { query });

  // ── 가짜 응답 (district를 안 보내면 대상자 등록 지역) ──
  const subject = await getSubject();
  return mockSearchResources(query, subject.district) as ResourceSearchResponse;
}

/** RES-01 기관·제도 상세 (로그인 필요) */
export async function getResourceDetail(resourceId: number): Promise<ResourceDetail> {
  // return api.get<ResourceDetail>(`/resources/${resourceId}`);

  // ── 가짜 응답 ──
  await mock.delay(400);
  const detail = mockResourceDetail(resourceId);
  if (!detail) throw new ApiError(404, 'COMMON_NOT_FOUND', '정보를 찾을 수 없어요.');
  return detail as ResourceDetail;
}

/** SUP-01 보호자 휴식 안내 문구 + 제도 목록 */
export async function getBurnoutGuide(): Promise<BurnoutGuide> {
  // return api.get<BurnoutGuide>('/support/burnout-guide');

  // ── 가짜 응답 ──
  await mock.delay(400);
  return structuredClone(mockCaregiverSupport);
}
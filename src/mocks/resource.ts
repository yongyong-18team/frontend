import type { District } from "@/constants/labels";
import { DISTRICT_LABEL } from "@/constants/labels";

/* ---------- 타입 (API 명세 v1.4 RES-01·RES-02) ---------- */

export type CareTerm = "SHORT" | "LONG";
export type ResourceKind = "FACILITY" | "PROGRAM";

/** RES-02 조건 (5.1 → 5.2로 넘기는 값, 저장 안 함) */
export type ResourceSearchQuery = {
  careTerm?: CareTerm;
  neededDate?: string; // yyyy-MM-dd
  district?: District; // 생략하면 대상자 등록 지역
  dong?: string;
  kind?: ResourceKind;
};

export type ResourceResult =
  | {
      resourceId: number;
      kind: "PROGRAM";
      name: string;
      summary: string;
      reasonText: string;
      officialUrl: string;
    }
  | {
      resourceId: number;
      kind: "FACILITY";
      name: string;
      district: District;
      phone: string;
      reasonText: string;
      officialUrl: string;
    };

/** RES-02 응답 */
export type ResourceSearchResponse = {
  condition: { careTerm: CareTerm | null; neededDate: string | null; district: District; dong: string | null };
  disclaimer: string;
  results: ResourceResult[];
};

/** RES-01 응답 (시설 / 제도) */
export type ResourceDetail =
  | {
      resourceId: number;
      kind: "FACILITY";
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
      kind: "PROGRAM";
      name: string;
      phone: string;
      officialUrl: string;
      programType: string;
      careTerm: CareTerm | "BOTH" | null;
      summary: string;
      eligibilitySummary: string;
      procedure: string;
      sourceDoc: string;
      docVersion: string;
    };

/* ---------- 목업 데이터 (명세 예시 모양, 이름은 예시용) ---------- */

const DISCLAIMER = "실제 신청 자격과 이용 가능 여부는 해당 기관에 확인이 필요합니다.";

const DETAILS: ResourceDetail[] = [
  {
    resourceId: 1001, kind: "PROGRAM", name: "발달장애인 긴급돌봄", phone: "031-000-0001", officialUrl: "https://example.org/1001",
    programType: "EMERGENCY_CARE", careTerm: "SHORT",
    summary: "보호자 입원 등으로 일시적 돌봄이 필요할 때 이용하는 제도",
    eligibilitySummary: "보호자의 입원·경조사 등으로 일시적으로 돌봄이 어려운 발달장애인 가정",
    procedure: "주민센터 또는 지정 기관에 전화로 신청 → 상황 확인 → 돌봄 제공 기관 연결",
    sourceDoc: "용인시 발달장애인 지원 안내", docVersion: "2026",
  },
  {
    resourceId: 1002, kind: "PROGRAM", name: "발달장애인 주간활동서비스", phone: "031-000-0002", officialUrl: "https://example.org/1002",
    programType: "DAY_ACTIVITY", careTerm: "LONG",
    summary: "낮 시간 동안 지역사회에서 활동하며 정기적으로 돌봄을 받을 수 있는 서비스",
    eligibilitySummary: "만 18세 이상 65세 미만 발달장애인",
    procedure: "주민센터 신청 → 서비스 지원 종합조사 → 제공기관 선택",
    sourceDoc: "용인시 발달장애인 지원 안내", docVersion: "2026",
  },
  {
    resourceId: 1003, kind: "PROGRAM", name: "청소년 발달장애학생 방과후활동서비스", phone: "031-000-0003", officialUrl: "https://example.org/1003",
    programType: "ACTIVITY_SUPPORT", careTerm: "LONG",
    summary: "방과 후 시간에 정기적으로 활동과 돌봄을 지원하는 서비스",
    eligibilitySummary: "만 12세 이상 18세 미만 발달장애 학생",
    procedure: "주민센터 신청 → 서비스 지원 종합조사 → 제공기관 선택",
    sourceDoc: "용인시 발달장애인 지원 안내", docVersion: "2026",
  },
  {
    resourceId: 1101, kind: "PROGRAM", name: "발달장애인 부모상담 지원", phone: "031-000-1101", officialUrl: "https://example.org/1101",
    programType: "PARENT_COUNSELING", careTerm: null,
    summary: "보호자가 전문 상담을 받을 수 있도록 상담 비용을 지원해요",
    eligibilitySummary: "발달장애인의 부모 또는 보호자",
    procedure: "주민센터 신청 → 상담 기관 연결",
    sourceDoc: "용인시 발달장애인 지원 안내", docVersion: "2026",
  },
  {
    resourceId: 1102, kind: "PROGRAM", name: "가족휴식지원", phone: "031-000-1102", officialUrl: "https://example.org/1102",
    programType: "FAMILY_REST", careTerm: null,
    summary: "돌봄 가족이 잠시 쉴 수 있도록 휴식 프로그램을 지원해요",
    eligibilitySummary: "발달장애인을 돌보는 가족",
    procedure: "주민센터 또는 장애인복지관 신청",
    sourceDoc: "용인시 발달장애인 지원 안내", docVersion: "2026",
  },
  {
    resourceId: 2034, kind: "FACILITY", name: "○○ 단기거주시설", phone: "031-000-2034", officialUrl: "https://example.org/2034",
    facilityType: "단기거주시설", district: "SUJI", address: "용인시 수지구 ○○로 00",
    services: "단기 보호, 일상생활 지원", source: "YONGIN_API", fetchedAt: "2026-11-01T09:00:00+09:00",
  },
  {
    resourceId: 2035, kind: "FACILITY", name: "△△ 단기보호센터", phone: "031-000-2035", officialUrl: "https://example.org/2035",
    facilityType: "단기거주시설", district: "GIHEUNG", address: "용인시 기흥구 △△로 00",
    services: "단기 보호, 주말 돌봄", source: "YONGIN_API", fetchedAt: "2026-11-01T09:00:00+09:00",
  },
  {
    resourceId: 2040, kind: "FACILITY", name: "□□ 주간보호센터", phone: "031-000-2040", officialUrl: "https://example.org/2040",
    facilityType: "주간보호시설", district: "SUJI", address: "용인시 수지구 □□로 00",
    services: "주간 보호, 활동 프로그램", source: "YONGIN_API", fetchedAt: "2026-11-01T09:00:00+09:00",
  },
  {
    resourceId: 2041, kind: "FACILITY", name: "◇◇ 주간보호센터", phone: "031-000-2041", officialUrl: "https://example.org/2041",
    facilityType: "주간보호시설", district: "CHEOIN", address: "용인시 처인구 ◇◇로 00",
    services: "주간 보호, 직업 훈련", source: "YONGIN_API", fetchedAt: "2026-11-01T09:00:00+09:00",
  },
];

const FACILITY_FOR: Record<CareTerm, string> = { SHORT: "단기거주시설", LONG: "주간보호시설" };
const TERM_LABEL: Record<CareTerm, string> = { SHORT: "단기", LONG: "장기" };

/** RES-02 목업: 제도는 careTerm으로, 시설은 맞는 유형 + 같은 구 우선 */
export function mockSearchResources(q: ResourceSearchQuery, registeredDistrict: District): ResourceSearchResponse {
  const district = q.district ?? registeredDistrict;
  const results: ResourceResult[] = [];

  if (q.kind !== "FACILITY") {
    for (const d of DETAILS) {
      if (d.kind !== "PROGRAM") continue;
      const match = q.careTerm ? d.careTerm === q.careTerm || d.careTerm === "BOTH" : true;
      if (!match) continue;
      results.push({
        resourceId: d.resourceId, kind: "PROGRAM", name: d.name, summary: d.summary, officialUrl: d.officialUrl,
        reasonText: q.careTerm ? `${TERM_LABEL[q.careTerm]} 돌봄과 관련된 제도예요.` : "보호자가 이용할 수 있는 제도예요.",
      });
    }
  }

  if (q.kind !== "PROGRAM") {
    const facilities = DETAILS.filter(
      (d): d is Extract<ResourceDetail, { kind: "FACILITY" }> =>
        d.kind === "FACILITY" && (!q.careTerm || d.facilityType === FACILITY_FOR[q.careTerm]),
    ).sort((a, b) => Number(b.district === district) - Number(a.district === district));
    for (const f of facilities) {
      results.push({
        resourceId: f.resourceId, kind: "FACILITY", name: f.name, district: f.district, phone: f.phone, officialUrl: f.officialUrl,
        reasonText: `${DISTRICT_LABEL[f.district]}에 있는 ${f.facilityType}이에요.`,
      });
    }
  }

  return {
    condition: { careTerm: q.careTerm ?? null, neededDate: q.neededDate ?? null, district, dong: q.dong ?? null },
    disclaimer: DISCLAIMER,
    results,
  };
}

/** RES-01 목업 */
export function mockResourceDetail(resourceId: number): ResourceDetail | null {
  return DETAILS.find((d) => d.resourceId === resourceId) ?? null;
}
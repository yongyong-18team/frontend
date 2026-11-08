/* ---------- 타입 (API 명세 v1.4 SUP-01) ---------- */

export type SupportProgram = {
  resourceId: number;
  name: string;
  programType: string; // 예: FAMILY_REST, PARENT_COUNSELING, EMERGENCY_CARE
};

/** SUP-01 응답 */
export type CaregiverSupportResponse = {
  message: string[];
  programs: SupportProgram[];
};

/* ---------- 목업 (문구는 Figma 5.4, 서버 문구는 D4에 확정) ---------- */

export const mockCaregiverSupport: CaregiverSupportResponse = {
  message: ["반복되는 돌봄 부담이 느껴진다면", "이용할 수 있는 전문 지원을 확인해 보세요."],
  programs: [
    { resourceId: 1102, name: "가족휴식지원", programType: "FAMILY_REST" },
    { resourceId: 1101, name: "발달장애인 부모상담 지원", programType: "PARENT_COUNSELING" },
    { resourceId: 1001, name: "발달장애인 긴급돌봄", programType: "EMERGENCY_CARE" },
  ],
};
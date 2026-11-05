import type { District } from "@/constants/labels";

/** SUBJ-02 응답 타입 (API 명세 v1.4) */
export type SubjectResponse = {
  subjectId: number;
  name: string;
  birthYear: number;
  age: number;
  district: District;
  dong: string | null;
  emergencyContact: string | null;
};

/** 목업: SUBJ-02 예시 그대로 */
export const mockSubject: SubjectResponse = {
  subjectId: 10,
  name: "민지",
  birthYear: 2001,
  age: 25,
  district: "SUJI",
  dong: "풍덕천동",
  emergencyContact: "어머니 010-0000-0000",
};
"use client";

import { Button } from "@/components/common";

/** 서버 오류일 때만 쓰는 다시 시도 버튼 */
export default function ReloadButton() {
  return (
    <Button variant="outline" fullWidth={false} onClick={() => window.location.reload()}>
      다시 시도
    </Button>
  );
}
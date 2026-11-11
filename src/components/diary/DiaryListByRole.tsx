// src/components/diary/DiaryListByRole.tsx
// 2.4 돌봄 기록 탭: 내 역할에 따라 화면을 고름 (API 명세 2-4)
//   OWNER        → DiaryList (DIARY-03, 원문·검토·새 기록)
//   공동 관리자   → DailyRecordList (REPORT-01, 반영된 항목만 보기)

'use client';

import Header from '@/components/common/Header';
import { ErrorState, LoadingState } from '@/components/common/StateView';
import DailyRecordList from '@/components/diary/DailyRecordList';
import DiaryList from '@/components/diary/DiaryList';
import { useSubjectRole } from '@/hooks/useSubjectRole';
import { getErrorMessage } from '@/lib/api/client';

export default function DiaryListByRole() {
  const { state, retry } = useSubjectRole();

  if (state.phase === 'done') return state.isOwner ? <DiaryList /> : <DailyRecordList />;

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[390px] flex-col bg-bg-base pt-[38px] pb-[104px]">
      <Header title="돌봄 기록" />
      <div className="px-6">
        {state.phase === 'loading' ? (
          <LoadingState count={3} label="정보를 불러오고 있어요." />
        ) : (
          <div className="mt-6">
            <ErrorState message={getErrorMessage(state.error)} onRetry={retry} />
          </div>
        )}
      </div>
    </main>
  );
}

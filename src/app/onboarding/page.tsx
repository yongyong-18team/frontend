// src/app/onboarding/page.tsx
// /onboarding 으로 들어오면 첫 단계로

import { redirect } from 'next/navigation';

export default function Page() {
  redirect('/onboarding/step-1');
}

/** "2026-11-05T20:50:00+09:00" → "11월 5일" */
export function formatDate(iso: string) {
  return `${Number(iso.slice(5, 7))}월 ${Number(iso.slice(8, 10))}일`;
}

/** "2026-11-05T20:50:00+09:00" → "11월 5일 20:50" */
export function formatDateTime(iso: string) {
  return `${formatDate(iso)} ${iso.slice(11, 16)}`;
}
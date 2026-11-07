// src/lib/date.ts
// 날짜 공통 함수 (2.1 날짜 칩, 2.4 목록·필터 등)
// 모두 사용자 브라우저의 시간대 기준입니다. 서버에서 렌더링되는 곳에서는 쓰지 마세요.

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

/** 11월 1일 (일) */
export function formatKoreanDate(date: Date) {
  return `${date.getMonth() + 1}월 ${date.getDate()}일 (${WEEKDAYS[date.getDay()]})`;
}

/** 10월 26일 */
export function formatMonthDay(date: Date) {
  return `${date.getMonth() + 1}월 ${date.getDate()}일`;
}

/** 요일 한 글자 (월, 화, …) */
export function weekdayLabel(date: Date) {
  return WEEKDAYS[date.getDay()];
}

/** n일 뒤 (음수면 n일 전) */
export function addDays(date: Date, n: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + n);
  return next;
}

/** YYYY-MM-DD 형식인지 */
export function isDateKey(value: string | undefined): value is string {
  return !!value && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(fromDateKey(value).getTime());
}

/** YYYY-MM-DD (API·주소에 쓰는 형식) */
export function toDateKey(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** YYYY-MM-DD → 그날 0시 (브라우저 시간대) */
export function fromDateKey(key: string) {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** 이번 주 월요일 0시 */
export function startOfWeek(today: Date) {
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const diff = (start.getDay() + 6) % 7; // 월요일 = 0
  start.setDate(start.getDate() - diff);
  return start;
}

/** 이번 주(월~일)에 속하는지 */
export function isThisWeek(date: Date, today: Date) {
  const start = startOfWeek(today);
  const end = new Date(start);
  end.setDate(start.getDate() + 7);
  return date >= start && date < end;
}

/** 이번 주(월~일) 범위 YYYY-MM-DD — DIARY-03 from/to */
export function thisWeekRange(today: Date) {
  const start = startOfWeek(today);
  return { from: toDateKey(start), to: toDateKey(addDays(start, 6)) };
}

/** 지난달(1일~말일) 범위 YYYY-MM-DD — DIARY-03 from/to */
export function lastMonthRange(today: Date) {
  const first = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const last = new Date(today.getFullYear(), today.getMonth(), 0);
  return { from: toDateKey(first), to: toDateKey(last) };
}

/** 지난달(달력 기준)에 속하는지 */
export function isLastMonth(date: Date, today: Date) {
  const last = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  return date.getFullYear() === last.getFullYear() && date.getMonth() === last.getMonth();
}

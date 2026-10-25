const pad = (value: number): string => String(value).padStart(2, '0');

const HALF_HOUR_MS = 30 * 60 * 1000;
const DEFAULT_LEAD_MS = 3 * 60 * 60 * 1000;

/** 폼 입력용으로 쪼갠 날짜·시·분 (date: YYYY-MM-DD, hour/minute: 두 자리) */
export interface DateTimeParts {
	readonly date: string;
	readonly hour: string;
	readonly minute: string;
}

export const toDateTimeParts = (value: Date): DateTimeParts => ({
	date: `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`,
	hour: pad(value.getHours()),
	minute: pad(value.getMinutes()),
});

export const fromDateTimeParts = (parts: DateTimeParts): Date | null => {
	const [year, month, day] = parts.date.split('-').map(Number);
	if (!year || !month || !day) return null;
	return new Date(year, month - 1, day, Number(parts.hour), Number(parts.minute), 0, 0);
};

export const HOUR_OPTIONS: readonly string[] = Array.from({ length: 24 }, (_, hour) => pad(hour));
export const COARSE_MINUTE_OPTIONS: readonly string[] = ['00', '30'];
export const FINE_MINUTE_OPTIONS: readonly string[] = Array.from({ length: 60 }, (_, minute) => pad(minute));

/** 30분 단위가 아닌 시각이면 분 단위 입력이 필요하다 */
export const needsFineMinutes = (...dates: readonly Date[]): boolean =>
	dates.some(date => date.getMinutes() % 30 !== 0);

/** 30분 단위로 내린다(분 단위 입력을 끌 때) */
export const roundDownToHalfHour = (minute: string): string => (Number(minute) < 30 ? '00' : '30');

/**
 * 새 일정 기본 시작 시각: 지금부터 3시간 뒤를 30분 단위로 올린 시각.
 * 다른 날짜를 골랐으면 그 날짜의 같은 시각.
 */
export const getDefaultStart = (selectedDate: Date, now: Date): Date => {
	const base = new Date(Math.ceil((now.getTime() + DEFAULT_LEAD_MS) / HALF_HOUR_MS) * HALF_HOUR_MS);
	if (selectedDate.toDateString() === now.toDateString()) return base;
	return new Date(
		selectedDate.getFullYear(),
		selectedDate.getMonth(),
		selectedDate.getDate(),
		base.getHours(),
		base.getMinutes(),
	);
};

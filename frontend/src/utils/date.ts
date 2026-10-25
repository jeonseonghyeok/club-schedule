const pad = (value: number): string => String(value).padStart(2, '0');

/** 서버 LocalDateTime 과 같은 형식(yyyy-MM-ddTHH:mm:ss, 로컬 시각) */
export const toLocalDateTimeString = (date: Date): string =>
	`${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;

/** 화면 표시용 날짜·시각. 값이 없거나 해석할 수 없으면 대체 문자열 */
export const formatDateTime = (value: string | null, fallback = '-'): string => {
	if (!value) return fallback;
	const date = new Date(value);
	return Number.isNaN(date.getTime()) ? fallback : date.toLocaleString('ko-KR');
};

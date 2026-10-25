import { fromDateTimeParts, getDefaultStart, needsFineMinutes, toDateTimeParts } from '@/utils/dateTime';

describe('dateTime utils', () => {
	it('날짜·시·분으로 쪼갰다가 다시 합친다', () => {
		const date = new Date(2026, 9, 5, 7, 5);
		const parts = toDateTimeParts(date);
		expect(parts).toEqual({ date: '2026-10-05', hour: '07', minute: '05' });
		expect(fromDateTimeParts(parts)?.getTime()).toBe(date.getTime());
		expect(fromDateTimeParts({ date: '', hour: '00', minute: '00' })).toBeNull();
	});

	it('기본 시작: 오늘이면 3시간 뒤를 30분 단위로 올림, 다른 날이면 그 날 같은 시각', () => {
		const now = new Date(2026, 9, 25, 14, 10);
		expect(getDefaultStart(now, now)).toEqual(new Date(2026, 9, 25, 17, 30));
		expect(getDefaultStart(new Date(2026, 9, 28), now)).toEqual(new Date(2026, 9, 28, 17, 30));
	});

	it('30분 단위가 아니면 분 단위 입력이 필요하다', () => {
		expect(needsFineMinutes(new Date(2026, 0, 1, 9, 30))).toBe(false);
		expect(needsFineMinutes(new Date(2026, 0, 1, 9, 30), new Date(2026, 0, 1, 10, 15))).toBe(true);
	});
});

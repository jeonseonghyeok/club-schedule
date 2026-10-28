import type { GroupViewer } from '@/types/GroupDetail';
import type { Schedule, ScheduleStatus } from '@/types/Schedule';
import {
	buildMonthCells,
	canEditSchedule,
	formatAmPmTime,
	formatCapacity,
	formatRelativeDay,
	getDominantStatus,
	getUpcomingConfirmed,
	groupSchedulesByDate,
} from '@/utils/schedule';

const at = (y: number, m: number, d: number, h = 10, min = 0) => new Date(y, m - 1, d, h, min).getTime();

const schedule = (id: number, start: number, status: ScheduleStatus, createdBy = 1): Schedule => ({
	id,
	title: `일정${id}`,
	description: null,
	locationName: null,
	latitude: null,
	longitude: null,
	start,
	end: null,
	status,
	statusReason: null,
	createdBy,
	maxAttendance: 0,
	confirmedCount: 0,
	myAttendanceStatus: null,
});

const viewer = (overrides: Partial<GroupViewer>): GroupViewer => ({
	userKey: 1,
	isLeader: false,
	isManager: false,
	isMember: true,
	canCreateSchedule: true,
	createNeedsApproval: false,
	canManageSchedule: false,
	isFavoriteGroup: false,
	hasFavoriteGroup: false,
	...overrides,
});

describe('schedule utils', () => {
	it('인원 표시: 제한이 없으면 "제한없음"', () => {
		expect(formatCapacity(3, 10)).toBe('3/10명');
		expect(formatCapacity(3, 0)).toBe('3명 / 제한없음');
	});

	it('상대 날짜: 오늘·지난 일정은 "오늘", 이후는 N일 후', () => {
		const now = new Date(at(2026, 10, 25, 23, 0));
		expect(formatRelativeDay(at(2026, 10, 25, 1), now)).toBe('오늘');
		expect(formatRelativeDay(at(2026, 10, 26, 0, 30), now)).toBe('1일 후');
		expect(formatRelativeDay(at(2026, 11, 1), now)).toBe('7일 후');
	});

	it('오전/오후 시각, 정각이면 분 생략', () => {
		expect(formatAmPmTime(at(2026, 1, 1, 0, 0))).toBe('오전 12시');
		expect(formatAmPmTime(at(2026, 1, 1, 15, 30))).toBe('오후 3시30분');
	});

	it('임박 일정: 확정·미래만 시작순 3개', () => {
		const now = at(2026, 10, 25, 12);
		const list = [
			schedule(1, at(2026, 10, 30), 'CONFIRMED'),
			schedule(2, at(2026, 10, 26), 'CONFIRMED'),
			schedule(3, at(2026, 10, 24), 'CONFIRMED'),
			schedule(4, at(2026, 10, 27), 'PENDING'),
			schedule(5, at(2026, 10, 28), 'CONFIRMED'),
			schedule(6, at(2026, 11, 2), 'CONFIRMED'),
		];
		expect(getUpcomingConfirmed(list, now).map(s => s.id)).toEqual([2, 5, 1]);
	});

	it('달력은 1일이 속한 주의 일요일부터 42칸', () => {
		const cells = buildMonthCells(new Date(2026, 9, 1)); // 2026-10-01 은 목요일
		expect(cells).toHaveLength(42);
		expect(cells[0]?.getDate()).toBe(27); // 9/27 (일)
		expect(cells[0]?.getDay()).toBe(0);
		expect(cells[4]?.getDate()).toBe(1);
	});

	it('날짜별 묶기와 필터, 대기 상태 우선 배지', () => {
		const list = [
			schedule(1, at(2026, 10, 5, 9), 'CONFIRMED'),
			schedule(2, at(2026, 10, 5, 18), 'PENDING'),
			schedule(3, at(2026, 10, 6), 'CANCELLED'),
		];
		const all = groupSchedulesByDate(list, 'ALL');
		expect(all.get('2026-10-05')?.map(s => s.id)).toEqual([1, 2]);
		expect(getDominantStatus(all.get('2026-10-05') ?? [])).toBe('PENDING');
		expect(groupSchedulesByDate(list, 'CONFIRMED').get('2026-10-06')).toBeUndefined();
	});

	it('수정 권한: 관리자는 확정 일정, 작성자는 자기 대기 일정', () => {
		expect(canEditSchedule(schedule(1, 0, 'CONFIRMED', 2), viewer({ canManageSchedule: true }))).toBe(true);
		expect(canEditSchedule(schedule(1, 0, 'PENDING', 2), viewer({ canManageSchedule: true }))).toBe(false);
		expect(canEditSchedule(schedule(1, 0, 'PENDING', 1), viewer({}))).toBe(true);
		expect(canEditSchedule(schedule(1, 0, 'CONFIRMED', 1), viewer({}))).toBe(false);
	});
});

import type { GroupViewer } from '@/types/GroupDetail';
import { SCHEDULE_STATUS } from '@/types/Schedule';
import type { AttendanceStatus, Schedule, ScheduleStatus } from '@/types/Schedule';

const DAY_MS = 24 * 60 * 60 * 1000;
export const HOUR_MS = 60 * 60 * 1000;
export const CALENDAR_CELL_COUNT = 42;
export const UPCOMING_LIMIT = 3;

export const SCHEDULE_STATUS_LABEL = {
	PENDING: '승인 대기',
	CONFIRMED: '승인',
	REJECTED: '거부',
	CANCELLED: '취소',
} as const satisfies Record<ScheduleStatus, string>;

export const ATTENDANCE_STATUS_LABEL = {
	PENDING: '대기',
	CONFIRMED: '확정',
	REJECTED: '거부',
	CANCELLED: '취소',
} as const satisfies Record<AttendanceStatus, string>;

export const STATUS_TONE_CLASS = {
	PENDING: 'bg-yellow-100 text-yellow-900',
	CONFIRMED: 'bg-green-100 text-green-800',
	REJECTED: 'bg-red-100 text-red-800',
	CANCELLED: 'bg-gray-100 text-gray-600',
} as const satisfies Record<ScheduleStatus, string>;

export const getScheduleTitle = (schedule: Pick<Schedule, 'title'>): string => schedule.title || '일정';

/** 0 이면 제한 없음 */
export const formatCapacity = (count: number, max: number): string =>
	max > 0 ? `${count}/${max}명` : `${count}명 / 제한없음`;

/** 같은 날이면 "오늘", 이후면 "N일 후" */
export const formatRelativeDay = (startMs: number, now: Date): string => {
	const start = new Date(startMs);
	const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
	const day = new Date(start.getFullYear(), start.getMonth(), start.getDate()).getTime();
	const diff = Math.round((day - today) / DAY_MS);
	return diff <= 0 ? '오늘' : `${diff}일 후`;
};

/** "오후 3시", "오전 9시30분" */
export const formatAmPmTime = (ms: number): string => {
	const date = new Date(ms);
	const hours = date.getHours();
	const minutes = date.getMinutes();
	const hour12 = hours % 12 === 0 ? 12 : hours % 12;
	return `${hours < 12 ? '오전' : '오후'} ${hour12}시${minutes > 0 ? `${minutes}분` : ''}`;
};

export const toDateKey = (date: Date): string =>
	`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

/** 다가오는 확정 일정(시작 시각 순) */
export const getUpcomingConfirmed = (schedules: readonly Schedule[], now: number, limit = UPCOMING_LIMIT): Schedule[] =>
	schedules
		.filter(schedule => schedule.status === SCHEDULE_STATUS.CONFIRMED && schedule.start >= now)
		.sort((a, b) => a.start - b.start)
		.slice(0, limit);

export const startOfMonth = (date: Date): Date => new Date(date.getFullYear(), date.getMonth(), 1);

/** 달력 6주(42칸): 그 달 1일이 속한 주의 일요일부터 */
export const buildMonthCells = (monthStart: Date): Date[] => {
	const first = new Date(monthStart.getFullYear(), monthStart.getMonth(), 1 - monthStart.getDay());
	return Array.from(
		{ length: CALENDAR_CELL_COUNT },
		(_, index) => new Date(first.getFullYear(), first.getMonth(), first.getDate() + index),
	);
};

export const SCHEDULE_FILTER_ALL = 'ALL';
export type ScheduleFilter = ScheduleStatus | typeof SCHEDULE_FILTER_ALL;

export const groupSchedulesByDate = (
	schedules: readonly Schedule[],
	filter: ScheduleFilter,
): Map<string, Schedule[]> => {
	const byDate = new Map<string, Schedule[]>();
	schedules
		.filter(schedule => filter === SCHEDULE_FILTER_ALL || schedule.status === filter)
		.forEach(schedule => {
			const key = toDateKey(new Date(schedule.start));
			byDate.set(key, [...(byDate.get(key) ?? []), schedule]);
		});
	return byDate;
};

const STATUS_PRIORITY: readonly ScheduleStatus[] = ['PENDING', 'CONFIRMED', 'REJECTED', 'CANCELLED'];

/** 날짜 칸 배지 색: 처리할 일(대기)이 있으면 대기를 먼저 보여준다 */
export const getDominantStatus = (schedules: readonly Schedule[]): ScheduleStatus =>
	STATUS_PRIORITY.find(status => schedules.some(schedule => schedule.status === status)) ?? SCHEDULE_STATUS.CANCELLED;

const isCreator = (schedule: Schedule, viewer: GroupViewer): boolean =>
	viewer.userKey !== null && schedule.createdBy === viewer.userKey;

/** 수정: 관리자는 확정 일정, 작성자는 승인 대기 중인 자기 일정 */
export const canEditSchedule = (schedule: Schedule, viewer: GroupViewer): boolean =>
	(viewer.canManageSchedule && schedule.status === SCHEDULE_STATUS.CONFIRMED) ||
	(isCreator(schedule, viewer) && schedule.status === SCHEDULE_STATUS.PENDING);

/** 참가자 승인·거부: 일정 관리자이거나 일정 작성자 */
export const canManageAttendees = (schedule: Schedule, viewer: GroupViewer): boolean =>
	viewer.canManageSchedule || isCreator(schedule, viewer);

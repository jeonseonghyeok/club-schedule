export const SCHEDULE_STATUS = {
	PENDING: 'PENDING',
	CONFIRMED: 'CONFIRMED',
	REJECTED: 'REJECTED',
	CANCELLED: 'CANCELLED',
} as const;
export type ScheduleStatus = (typeof SCHEDULE_STATUS)[keyof typeof SCHEDULE_STATUS];

export const ATTENDANCE_STATUS = {
	PENDING: 'PENDING',
	CONFIRMED: 'CONFIRMED',
	REJECTED: 'REJECTED',
	CANCELLED: 'CANCELLED',
} as const;
export type AttendanceStatus = (typeof ATTENDANCE_STATUS)[keyof typeof ATTENDANCE_STATUS];

export const ACTUAL_STATUS = { NONE: 'NONE', ATTENDED: 'ATTENDED', NOSHOW: 'NOSHOW' } as const;
export type ActualStatus = (typeof ACTUAL_STATUS)[keyof typeof ACTUAL_STATUS];

/** GET /api/groups/{groupId}/schedules 항목(달력 이벤트 형태) */
export interface Schedule {
	readonly id: number;
	readonly title: string | null;
	readonly description: string | null;
	readonly locationName: string | null;
	/** epoch ms */
	readonly start: number;
	readonly end: number | null;
	readonly status: ScheduleStatus;
	readonly createdBy: number | null;
	/** 0 이면 인원 제한 없음 */
	readonly maxAttendance: number;
	readonly confirmedCount: number;
	readonly myAttendanceStatus: AttendanceStatus | null;
}

/** POST·PATCH 일정 페이로드 — 백엔드가 snake_case 키를 읽는다 */
export interface SchedulePayload {
	readonly title: string;
	readonly content: string | null;
	readonly location_name: string | null;
	readonly start: number;
	readonly end: number | null;
	readonly max_attendance: number;
}

export interface ScheduleEditPayload extends SchedulePayload {
	readonly changeReason: string;
}

export const SCHEDULE_ACTION = { APPROVE: 'approve', REJECT: 'reject', CANCEL: 'cancel' } as const;
export type ScheduleAction = (typeof SCHEDULE_ACTION)[keyof typeof SCHEDULE_ACTION];

/** 일정 참가자(관리용 명단) */
export interface Attendee {
	readonly userKey: number;
	readonly displayName: string | null;
	readonly status: AttendanceStatus;
	readonly actualStatus: ActualStatus | null;
}

/** 참가 신청 이력 */
export interface AttendanceHistoryItem {
	readonly attendanceId: number;
	readonly createdAt: string | null;
	readonly status: AttendanceStatus;
	readonly displayName: string | null;
	readonly actorDisplayName: string | null;
}

/** 참가인원 팝오버용 간단 명단 */
export interface RosterEntry {
	readonly displayName: string | null;
	readonly status: AttendanceStatus;
}

/** 내 참가 이력 */
export interface MyAttendance {
	readonly scheduleId: number;
	readonly scheduleTitle: string | null;
	readonly scheduleStartAt: string | null;
	readonly status: AttendanceStatus;
	readonly actualStatus: ActualStatus | null;
}

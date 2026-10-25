import type { ActualStatus, Attendee, AttendanceHistoryItem, MyAttendance, RosterEntry } from '@/types/Schedule';
import { attendanceApi } from '.';

interface ScheduleTarget {
	readonly groupId: number;
	readonly scheduleId: number;
}

interface AttendeeTarget extends ScheduleTarget {
	readonly userKey: number;
}

const schedulePath = (target: ScheduleTarget): string => `/api/groups/${target.groupId}/schedules/${target.scheduleId}`;

export const createAttendance = async (target: ScheduleTarget): Promise<void> => {
	await attendanceApi.post(`${schedulePath(target)}/attend`);
};

export const deleteAttendance = async (target: ScheduleTarget): Promise<void> => {
	await attendanceApi.delete(`${schedulePath(target)}/attend`);
};

export const getAttendees = async (target: ScheduleTarget): Promise<Attendee[]> => {
	const { data } = await attendanceApi.get<Attendee[]>(`${schedulePath(target)}/attendance`);
	return data;
};

export const getAttendanceHistory = async (target: ScheduleTarget): Promise<AttendanceHistoryItem[]> => {
	const { data } = await attendanceApi.get<AttendanceHistoryItem[]>(`${schedulePath(target)}/attendance/history`);
	return data;
};

/** 여러 일정의 참가 명단을 한 번에 — { [scheduleId]: RosterEntry[] } */
export const getRosters = async (params: {
	groupId: number;
	scheduleIds: readonly number[];
}): Promise<Record<string, RosterEntry[]>> => {
	const query = new URLSearchParams({ scheduleIds: params.scheduleIds.join(',') });
	const { data } = await attendanceApi.get<Record<string, RosterEntry[]>>(
		`/api/groups/${params.groupId}/attendance/roster?${query.toString()}`,
	);
	return data;
};

export const getMyAttendances = async (groupId: number): Promise<MyAttendance[]> => {
	const { data } = await attendanceApi.get<MyAttendance[]>(`/api/groups/${groupId}/attendance/me`);
	return data;
};

export const updateAttendeeApproval = async (target: AttendeeTarget): Promise<void> => {
	await attendanceApi.patch(`${schedulePath(target)}/attendance/${target.userKey}/approve`);
};

export const updateAttendeeRejection = async (target: AttendeeTarget): Promise<void> => {
	await attendanceApi.patch(`${schedulePath(target)}/attendance/${target.userKey}/reject`);
};

/** 관리자가 확정된 참가를 취소 */
export const deleteAttendee = async (target: AttendeeTarget): Promise<void> => {
	await attendanceApi.delete(`${schedulePath(target)}/attendance/${target.userKey}`);
};

export const updateAttendeeCheck = async (target: AttendeeTarget & { actualStatus: ActualStatus }): Promise<void> => {
	await attendanceApi.patch(`${schedulePath(target)}/attendance/${target.userKey}/check`, {
		actualStatus: target.actualStatus,
	});
};

import type { Schedule, ScheduleAction, ScheduleEditPayload, SchedulePayload } from '@/types/Schedule';
import { scheduleApi } from '.';

interface ScheduleTarget {
	readonly groupId: number;
	readonly scheduleId: number;
}

/** 모임의 모든 일정(기간 미지정). 응답의 start/end 는 epoch ms */
export const getSchedules = async (groupId: number): Promise<Schedule[]> => {
	const { data } = await scheduleApi.get<Schedule[]>(`/api/groups/${groupId}/schedules`);
	return data;
};

export const createSchedule = async (params: { groupId: number; payload: SchedulePayload }): Promise<Schedule> => {
	const { data } = await scheduleApi.post<Schedule>(`/api/groups/${params.groupId}/schedules`, params.payload);
	return data;
};

export const updateSchedule = async (params: ScheduleTarget & { payload: ScheduleEditPayload }): Promise<Schedule> => {
	const { data } = await scheduleApi.patch<Schedule>(
		`/api/groups/${params.groupId}/schedules/${params.scheduleId}`,
		params.payload,
	);
	return data;
};

/** 승인·거부·취소 — 처리 후의 일정을 돌려준다. 거부·취소 사유는 일정의 statusReason 으로 남는다 */
export const updateScheduleStatus = async (
	params: ScheduleTarget & { action: ScheduleAction; reason: string | null },
): Promise<Schedule> => {
	const { data } = await scheduleApi.patch<Schedule>(
		`/api/groups/${params.groupId}/schedules/${params.scheduleId}/${params.action}`,
		params.reason ? { reason: params.reason } : undefined,
	);
	return data;
};

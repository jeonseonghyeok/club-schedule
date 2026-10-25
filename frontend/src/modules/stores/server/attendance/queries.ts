import { queryOptions } from '@tanstack/react-query';
import { getAttendanceHistory, getAttendees, getMyAttendances, getRosters } from '@/modules/api/attendance/attendance';

/** 참가인원 팝오버 명단은 자주 바뀌므로 짧게만 재사용한다(기존 화면과 같은 30초) */
const ROSTER_STALE_MS = 30_000;

export const attendanceQueries = {
	all: () => ['attendance'],
	ofGroup: (groupId: number) => [...attendanceQueries.all(), groupId],
	attendees: (params: { groupId: number; scheduleId: number }) =>
		queryOptions({
			queryKey: [...attendanceQueries.ofGroup(params.groupId), params.scheduleId, 'attendees'],
			queryFn: () => getAttendees(params),
		}),
	history: (params: { groupId: number; scheduleId: number }) =>
		queryOptions({
			queryKey: [...attendanceQueries.ofGroup(params.groupId), params.scheduleId, 'history'],
			queryFn: () => getAttendanceHistory(params),
		}),
	roster: (params: { groupId: number; scheduleId: number }) =>
		queryOptions({
			queryKey: [...attendanceQueries.ofGroup(params.groupId), params.scheduleId, 'roster'],
			queryFn: async () => {
				const byId = await getRosters({ groupId: params.groupId, scheduleIds: [params.scheduleId] });
				return byId[String(params.scheduleId)] ?? [];
			},
			staleTime: ROSTER_STALE_MS,
		}),
	mine: (groupId: number) =>
		queryOptions({
			queryKey: [...attendanceQueries.ofGroup(groupId), 'me'],
			queryFn: () => getMyAttendances(groupId),
		}),
};

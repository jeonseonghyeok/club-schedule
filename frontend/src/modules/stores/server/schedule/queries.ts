import { queryOptions } from '@tanstack/react-query';
import { getSchedules } from '@/modules/api/schedule/schedule';

export const scheduleQueries = {
	all: () => ['schedules'],
	/** 모임의 모든 일정 — 홈(임박 일정)·달력·관리 탭이 같은 캐시를 나눠 쓴다 */
	list: (groupId: number) =>
		queryOptions({
			queryKey: [...scheduleQueries.all(), groupId],
			queryFn: () => getSchedules(groupId),
		}),
};

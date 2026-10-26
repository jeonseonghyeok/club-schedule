import { keepPreviousData, queryOptions } from '@tanstack/react-query';
import { getGroupDetail, getGroupSettings, getMyGroups, getRecommendedGroups } from '@/modules/api/group/group';

export const groupQueries = {
	all: () => ['groups'],
	myGroups: () =>
		queryOptions({
			queryKey: [...groupQueries.all(), 'me'],
			queryFn: getMyGroups,
		}),
	recommended: (keyword: string) =>
		queryOptions({
			queryKey: [...groupQueries.all(), 'recommended', keyword],
			queryFn: () => getRecommendedGroups(keyword),
			// 검색어를 바꾸는 동안 이전 결과를 유지해 목록이 깜빡이지 않게 한다
			placeholderData: keepPreviousData,
		}),
	detail: (groupId: number) =>
		queryOptions({
			queryKey: [...groupQueries.all(), 'detail', groupId],
			queryFn: () => getGroupDetail(groupId),
			retry: false,
		}),
	settings: (groupId: number) =>
		queryOptions({
			queryKey: [...groupQueries.all(), 'settings', groupId],
			queryFn: () => getGroupSettings(groupId),
		}),
};

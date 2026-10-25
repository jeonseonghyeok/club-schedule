import { keepPreviousData, queryOptions } from '@tanstack/react-query';
import { getAdminGroupJoins, getAdminGroupRequests, getAdminGroups, getAdminUsers } from '@/modules/api/admin/admin';
import type { AdminGroupRequestListParams, AdminListParams } from '@/types/Admin';

// 페이지·검색어를 바꾸는 동안 이전 결과를 유지해 표가 깜빡이지 않게 한다
export const adminQueries = {
	all: () => ['admin'],
	users: (params: AdminListParams) =>
		queryOptions({
			queryKey: [...adminQueries.all(), 'users', params],
			queryFn: () => getAdminUsers(params),
			placeholderData: keepPreviousData,
		}),
	groups: (params: AdminListParams) =>
		queryOptions({
			queryKey: [...adminQueries.all(), 'groups', params],
			queryFn: () => getAdminGroups(params),
			placeholderData: keepPreviousData,
		}),
	groupRequestsAll: () => [...adminQueries.all(), 'groupRequests'],
	groupRequests: (params: AdminGroupRequestListParams) =>
		queryOptions({
			queryKey: [...adminQueries.groupRequestsAll(), params],
			queryFn: () => getAdminGroupRequests(params),
			placeholderData: keepPreviousData,
		}),
	groupJoinsAll: () => [...adminQueries.all(), 'groupJoins'],
	groupJoins: (params: AdminListParams) =>
		queryOptions({
			queryKey: [...adminQueries.groupJoinsAll(), params],
			queryFn: () => getAdminGroupJoins(params),
			placeholderData: keepPreviousData,
		}),
};

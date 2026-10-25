import { queryOptions } from '@tanstack/react-query';
import { getMyJoinRequests, getPendingJoinRequests } from '@/modules/api/joinRequest/joinRequest';

export const joinRequestQueries = {
	all: () => ['joinRequests'],
	mine: (groupId: number) =>
		queryOptions({
			queryKey: [...joinRequestQueries.all(), groupId, 'me'],
			queryFn: () => getMyJoinRequests(groupId),
		}),
	pending: (groupId: number) =>
		queryOptions({
			queryKey: [...joinRequestQueries.all(), groupId, 'pending'],
			queryFn: () => getPendingJoinRequests(groupId),
		}),
};

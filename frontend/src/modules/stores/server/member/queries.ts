import { queryOptions } from '@tanstack/react-query';
import { getMembers } from '@/modules/api/member/member';

export const memberQueries = {
	all: () => ['members'],
	list: (groupId: number) =>
		queryOptions({
			queryKey: [...memberQueries.all(), groupId],
			queryFn: () => getMembers(groupId),
		}),
};

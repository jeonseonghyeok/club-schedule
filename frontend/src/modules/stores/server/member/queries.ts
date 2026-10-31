import { queryOptions } from '@tanstack/react-query';
import { getMemberNicknameHistory, getMembers } from '@/modules/api/member/member';

export const memberQueries = {
	all: () => ['members'],
	list: (groupId: number) =>
		queryOptions({
			queryKey: [...memberQueries.all(), groupId],
			queryFn: () => getMembers(groupId),
		}),
	nicknameHistory: (groupId: number, userKey: number) =>
		queryOptions({
			queryKey: [...memberQueries.all(), groupId, 'nicknameHistory', userKey],
			queryFn: () => getMemberNicknameHistory({ groupId, userKey }),
		}),
};

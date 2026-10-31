import { queryOptions } from '@tanstack/react-query';
import { getMyNicknameHistory } from '@/modules/api/user/user';

export const userQueries = {
	all: () => ['user'],
	nicknameHistory: () =>
		queryOptions({
			queryKey: [...userQueries.all(), 'nicknameHistory'],
			queryFn: getMyNicknameHistory,
		}),
};

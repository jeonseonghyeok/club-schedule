import { queryOptions } from '@tanstack/react-query';
import { getGroupRequests } from '@/modules/api/groupRequest/groupRequest';

export const groupRequestQueries = {
	all: () => ['groupRequests'],
	myRequests: () =>
		queryOptions({
			queryKey: [...groupRequestQueries.all(), 'me'],
			queryFn: getGroupRequests,
		}),
};

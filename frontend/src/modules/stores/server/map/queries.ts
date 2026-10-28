import { queryOptions } from '@tanstack/react-query';
import { getMapGroups, getMapSchedules } from '@/modules/api/map/map';

export const mapQueries = {
	all: () => ['map'],
	groups: () =>
		queryOptions({
			queryKey: [...mapQueries.all(), 'groups'],
			queryFn: getMapGroups,
		}),
	schedules: () =>
		queryOptions({
			queryKey: [...mapQueries.all(), 'schedules'],
			queryFn: getMapSchedules,
		}),
};

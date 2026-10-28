import { queryOptions } from '@tanstack/react-query';
import { getPlaces } from '@/modules/api/place/place';

// 같은 검색어는 잠시 다시 부르지 않는다(외부 API 호출량)
const PLACE_STALE_MS = 5 * 60_000;
export const PLACE_KEYWORD_MIN = 2;

export const placeQueries = {
	all: () => ['places'],
	search: (keyword: string) =>
		queryOptions({
			queryKey: [...placeQueries.all(), keyword],
			queryFn: () => getPlaces(keyword),
			enabled: keyword.length >= PLACE_KEYWORD_MIN,
			staleTime: PLACE_STALE_MS,
			retry: false,
		}),
};

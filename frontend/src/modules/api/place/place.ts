import type { Place } from '@/types/Place';
import { placeApi } from '.';

/** 장소 키워드 검색(2~50자). 카카오맵이 설정되지 않았으면 503 */
export const getPlaces = async (keyword: string): Promise<Place[]> => {
	const query = new URLSearchParams({ q: keyword });
	const { data } = await placeApi.get<Place[]>(`/api/places?${query.toString()}`);
	return data;
};

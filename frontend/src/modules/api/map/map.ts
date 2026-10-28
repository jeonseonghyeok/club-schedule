import type { MapGroup, MapSchedule } from '@/types/Map';
import { mapApi } from '.';

export const getMapGroups = async (): Promise<MapGroup[]> => {
	const { data } = await mapApi.get<MapGroup[]>('/api/map/groups');
	return data;
};

/** 기간을 주지 않으면 서버가 지금부터 90일을 돌려준다 */
export const getMapSchedules = async (): Promise<MapSchedule[]> => {
	const { data } = await mapApi.get<MapSchedule[]>('/api/map/schedules');
	return data;
};

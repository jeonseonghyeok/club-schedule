import type { Group } from '@/types/Group';
import { groupApi } from '.';

export const getMyGroups = async (): Promise<Group[]> => {
	const { data } = await groupApi.get<Group[]>('/api/groups/me');
	return data;
};

export const getRecommendedGroups = async (keyword: string): Promise<Group[]> => {
	const query = new URLSearchParams();
	if (keyword) query.set('q', keyword);
	const { data } = await groupApi.get<Group[]>(`/api/groups/recommended?${query.toString()}`);
	return data;
};

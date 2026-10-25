import type { Group } from '@/types/Group';
import type { GroupDetail } from '@/types/GroupDetail';
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

export const getGroupDetail = async (groupId: number): Promise<GroupDetail> => {
	const { data } = await groupApi.get<GroupDetail>(`/api/groups/${groupId}`);
	return data;
};

/** 우선(즐겨찾기) 모임으로 지정 — 다른 모임이 지정돼 있었다면 바뀐다 */
export const createGroupFavorite = async (groupId: number): Promise<void> => {
	await groupApi.put(`/api/groups/${groupId}/favorite`);
};

export const deleteGroupFavorite = async (groupId: number): Promise<void> => {
	await groupApi.delete(`/api/groups/${groupId}/favorite`);
};

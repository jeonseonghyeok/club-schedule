import type { Group, MyGroup } from '@/types/Group';
import type { GroupDetail } from '@/types/GroupDetail';
import type { GroupInfoPayload, GroupPolicy, GroupSettings } from '@/types/GroupSettings';
import { groupApi } from '.';

export const getMyGroups = async (): Promise<MyGroup[]> => {
	const { data } = await groupApi.get<MyGroup[]>('/api/groups/me');
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

/** 리더·매니저: 모임 기본 정보 + 일정 운영 정책 */
export const getGroupSettings = async (groupId: number): Promise<GroupSettings> => {
	const { data } = await groupApi.get<GroupSettings>(`/api/groups/${groupId}/settings`);
	return data;
};

/** 리더·매니저: 이름·설명·정원·가입 자동 승인 — 저장된 설정 전체를 돌려준다 */
export const updateGroup = async (params: { groupId: number; payload: GroupInfoPayload }): Promise<GroupSettings> => {
	const { data } = await groupApi.patch<GroupSettings>(`/api/groups/${params.groupId}`, params.payload);
	return data;
};

/** 리더 전용: 일정 운영 정책 전체 교체 */
export const updateGroupPolicy = async (params: { groupId: number; policy: GroupPolicy }): Promise<GroupSettings> => {
	const { data } = await groupApi.put<GroupSettings>(`/api/groups/${params.groupId}/policy`, params.policy);
	return data;
};

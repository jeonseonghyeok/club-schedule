import type { JoinRequest, JoinRequestCreated } from '@/types/JoinRequest';
import { joinRequestApi } from '.';

/** 내 가입 요청 이력(최신순) */
export const getMyJoinRequests = async (groupId: number): Promise<JoinRequest[]> => {
	const { data } = await joinRequestApi.get<JoinRequest[]>(`/api/groups/${groupId}/join-requests/me`);
	return data;
};

export const createJoinRequest = async (groupId: number): Promise<JoinRequestCreated> => {
	const { data } = await joinRequestApi.post<JoinRequestCreated>(`/api/groups/${groupId}/join-requests`);
	return data;
};

export const deleteJoinRequest = async (params: { groupId: number; requestId: number }): Promise<void> => {
	await joinRequestApi.delete(`/api/groups/${params.groupId}/join-requests/${params.requestId}`);
};

/** 리더용: 이 모임의 승인대기 가입 요청 */
export const getPendingJoinRequests = async (groupId: number): Promise<JoinRequest[]> => {
	const { data } = await joinRequestApi.get<JoinRequest[]>(`/api/groups/joins/pending/${groupId}`);
	return data;
};

export const updateJoinApproval = async (requestId: number): Promise<void> => {
	await joinRequestApi.patch(`/api/groups/joins/${requestId}/approve`);
};

export const updateJoinRejection = async (params: { requestId: number; rejectReason: string }): Promise<void> => {
	await joinRequestApi.patch(`/api/groups/joins/${params.requestId}/reject`, { rejectReason: params.rejectReason });
};

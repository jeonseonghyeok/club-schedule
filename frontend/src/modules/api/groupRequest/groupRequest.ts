import type { GroupRequest, GroupRequestCreated, GroupRequestCreatePayload } from '@/types/GroupRequest';
import { groupRequestApi } from '.';

export const getGroupRequests = async (): Promise<GroupRequest[]> => {
	const { data } = await groupRequestApi.get<GroupRequest[]>('/api/group-requests');
	return data;
};

/** 승인대기 신청이 있거나 이미 모임 리더면 409 */
export const createGroupRequest = async (payload: GroupRequestCreatePayload): Promise<GroupRequestCreated> => {
	const { data } = await groupRequestApi.post<GroupRequestCreated>('/api/group-requests', payload);
	return data;
};

export const updateGroupRequestCancel = async (requestId: number): Promise<void> => {
	await groupRequestApi.patch(`/api/group-requests/${requestId}/cancel`);
};

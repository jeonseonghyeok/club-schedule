import type {
	AdminGroup,
	AdminGroupJoin,
	AdminGroupRequest,
	AdminGroupRequestListParams,
	AdminListParams,
	AdminUser,
	GroupRequestApproval,
	RejectionParams,
} from '@/types/Admin';
import type { Paging } from '@/types/Paging';
import { adminApi } from '.';

export const ADMIN_PAGE_SIZE = 25;

const toQuery = (params: Record<string, string | number>): string => {
	const query = new URLSearchParams({ size: String(ADMIN_PAGE_SIZE) });
	Object.entries(params).forEach(([key, value]) => {
		if (value !== '') query.set(key, String(value));
	});
	return query.toString();
};

export const getAdminUsers = async (params: AdminListParams): Promise<Paging<AdminUser>> => {
	const { data } = await adminApi.get<Paging<AdminUser>>(`/api/admin/users?${toQuery({ ...params })}`);
	return data;
};

export const getAdminGroups = async (params: AdminListParams): Promise<Paging<AdminGroup>> => {
	const { data } = await adminApi.get<Paging<AdminGroup>>(`/api/admin/groups?${toQuery({ ...params })}`);
	return data;
};

export const getAdminGroupRequests = async (
	params: AdminGroupRequestListParams,
): Promise<Paging<AdminGroupRequest>> => {
	// status 는 빈 값(전체 이력)도 그대로 보내야 서버 기본값과 구분된다
	const query = new URLSearchParams(toQuery({ page: params.page, q: params.q }));
	query.set('status', params.status);
	const { data } = await adminApi.get<Paging<AdminGroupRequest>>(`/api/admin/group-requests?${query.toString()}`);
	return data;
};

/** 승인대기(PENDING) 가입 요청만 돌려준다 */
export const getAdminGroupJoins = async (params: AdminListParams): Promise<Paging<AdminGroupJoin>> => {
	const { data } = await adminApi.get<Paging<AdminGroupJoin>>(`/api/admin/group-joins?${toQuery({ ...params })}`);
	return data;
};

export const createGroupRequestApproval = async (requestId: number): Promise<GroupRequestApproval> => {
	const { data } = await adminApi.post<GroupRequestApproval>(`/api/admin/group-requests/${requestId}/approve`);
	return data;
};

export const createGroupRequestRejection = async (params: RejectionParams): Promise<void> => {
	await adminApi.post(`/api/admin/group-requests/${params.requestId}/reject`, { rejectReason: params.rejectReason });
};

export const createGroupJoinApproval = async (requestId: number): Promise<void> => {
	await adminApi.post(`/api/admin/group-joins/${requestId}/approve`);
};

export const createGroupJoinRejection = async (params: RejectionParams): Promise<void> => {
	await adminApi.post(`/api/admin/group-joins/${params.requestId}/reject`, {
		rejectReason: params.rejectReason || null,
	});
};

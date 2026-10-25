/** 모임 **생성** 신청(group_create_request). 가입 요청(join request)과는 별개다. */
export const GROUP_REQUEST_STATUS = {
	PENDING: 'PENDING',
	APPROVED: 'APPROVED',
	REJECTED: 'REJECTED',
	CANCELLED: 'CANCELLED',
} as const;
export type GroupRequestStatus = (typeof GROUP_REQUEST_STATUS)[keyof typeof GROUP_REQUEST_STATUS];

export interface GroupRequest {
	readonly requestId: number;
	readonly groupName: string | null;
	readonly description: string | null;
	/** ISO-8601 LocalDateTime (yyyy-MM-ddTHH:mm:ss) */
	readonly requestedAt: string | null;
	readonly status: GroupRequestStatus;
	readonly rejectReason: string | null;
	readonly statusUpdatedAt: string | null;
	/** 승인 후 생성된 모임 ID (APPROVED 일 때만) */
	readonly groupId: number | null;
}

export interface GroupRequestCreatePayload {
	readonly groupName: string;
	readonly description: string;
}

/** POST /api/group-requests 응답 */
export interface GroupRequestCreated {
	readonly requestId: number;
}

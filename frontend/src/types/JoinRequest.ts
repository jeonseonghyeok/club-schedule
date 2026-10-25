export const JOIN_STATUS = {
	PENDING: 'PENDING',
	APPROVED: 'APPROVED',
	REJECTED: 'REJECTED',
	CANCELLED: 'CANCELLED',
} as const;
export type JoinStatus = (typeof JOIN_STATUS)[keyof typeof JOIN_STATUS];

/** 모임 **가입** 요청(모임 생성 신청과 별개) */
export interface JoinRequest {
	readonly requestId: number;
	readonly userKey: number;
	readonly nickname: string | null;
	readonly status: JoinStatus;
	readonly requestedAt: string | null;
	readonly rejectReason: string | null;
}

export interface JoinRequestCreated {
	readonly requestId: number;
}

import { GROUP_REQUEST_STATUS } from '@/types/GroupRequest';
import type { GroupRequest, GroupRequestStatus } from '@/types/GroupRequest';
import type { Group } from '@/types/Group';
import { isLeaderOfAny } from '@/utils/group';

export const GROUP_REQUEST_STATUS_LABEL = {
	PENDING: '승인대기',
	APPROVED: '승인처리',
	REJECTED: '반려처리',
	CANCELLED: '신청취소',
} as const satisfies Record<GroupRequestStatus, string>;

/** 상세 화면의 "상태 변경일자" 접두어 */
export const GROUP_REQUEST_STATUS_CHANGE_LABEL = {
	PENDING: '변경',
	APPROVED: '승인',
	REJECTED: '반려',
	CANCELLED: '취소',
} as const satisfies Record<GroupRequestStatus, string>;

const toTime = (value: string | null): number => (value ? new Date(value).getTime() : 0);

export const sortByLatestRequested = (requests: readonly GroupRequest[]): GroupRequest[] =>
	[...requests].sort((a, b) => toTime(b.requestedAt) - toTime(a.requestedAt));

/**
 * 모임 생성 신청을 막는 사유. 신청 가능하면 null.
 * 서버도 같은 조건으로 409 를 주지만, 폼을 열기 전에 먼저 안내한다.
 */
export const getGroupRequestBlockReason = (params: {
	requests: readonly GroupRequest[];
	groups: readonly Group[];
	userKey: number;
}): string | null => {
	if (params.requests.some(request => request.status === GROUP_REQUEST_STATUS.PENDING)) {
		return '승인대기 건이 있어 신청하기를 할 수 없습니다.';
	}
	if (isLeaderOfAny(params.groups, params.userKey)) {
		return '모임의 리더는 신규 모임을 신청 할 수 없습니다.';
	}
	return null;
};

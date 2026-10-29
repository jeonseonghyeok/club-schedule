import type { Group } from '@/types/Group';
import type { GroupRequest, GroupRequestStatus } from '@/types/GroupRequest';
import { getGroupRequestBlockReason, sortByLatestRequested } from '@/utils/groupRequest';

const request = (requestId: number, status: GroupRequestStatus, requestedAt: string): GroupRequest => ({
	requestId,
	groupName: `신청${requestId}`,
	description: null,
	requestedAt,
	status,
	rejectReason: null,
	statusUpdatedAt: null,
	groupId: null,
});

const groupLedBy = (leaderUserKey: number): Group => ({
	groupId: 1,
	name: '모임',
	description: null,
	leaderUserKey,
	capacity: 10,
	currentMemberCount: 1,
	appEnabled: null,
});

describe('getGroupRequestBlockReason', () => {
	it('승인대기 신청이 있으면 막는다', () => {
		expect(
			getGroupRequestBlockReason({
				requests: [request(1, 'PENDING', '2026-10-01T10:00:00')],
				groups: [],
				userKey: 7,
			}),
		).toBe('승인대기 건이 있어 신청하기를 할 수 없습니다.');
	});

	it('이미 모임 리더면 막는다', () => {
		expect(getGroupRequestBlockReason({ requests: [], groups: [groupLedBy(7)], userKey: 7 })).toBe(
			'모임의 리더는 신규 모임을 신청 할 수 없습니다.',
		);
	});

	it('반려·취소만 있고 리더가 아니면 신청할 수 있다', () => {
		expect(
			getGroupRequestBlockReason({
				requests: [request(1, 'REJECTED', '2026-10-01T10:00:00'), request(2, 'CANCELLED', '2026-10-02T10:00:00')],
				groups: [groupLedBy(99)],
				userKey: 7,
			}),
		).toBeNull();
	});
});

describe('sortByLatestRequested', () => {
	it('신청일 최신순으로 정렬한다', () => {
		const sorted = sortByLatestRequested([
			request(1, 'APPROVED', '2026-09-01T10:00:00'),
			request(2, 'PENDING', '2026-10-01T10:00:00'),
			request(3, 'REJECTED', '2026-09-15T10:00:00'),
		]);
		expect(sorted.map(r => r.requestId)).toEqual([2, 3, 1]);
	});
});

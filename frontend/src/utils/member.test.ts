import type { GroupMember, GroupRole, MemberStatus } from '@/types/Member';
import { canChangeRole, canKick, filterSuspendedMembers, sortActiveMembers } from '@/utils/member';

const member = (
	userKey: number,
	role: GroupRole,
	status: MemberStatus = 'ACTIVE',
	leftAt: string | null = null,
): GroupMember => ({
	userKey,
	displayName: `회원${userKey}`,
	role,
	status,
	joinedAt: '2026-07-01T00:00:00',
	leftAt,
	banned: false,
	banReason: null,
	presets: [],
});

describe('member utils', () => {
	const members = [
		member(1, 'MEMBER'),
		member(2, 'LEADER'),
		member(3, 'MANAGER'),
		member(4, 'MEMBER', 'WITHDRAWN', '2026-08-01T00:00:00'),
		member(5, 'MEMBER', 'KICKED', '2026-09-01T00:00:00'),
	];

	it('활동 회원은 리더 → 매니저 → 일반 순', () => {
		expect(sortActiveMembers(members).map(m => m.userKey)).toEqual([2, 3, 1]);
	});

	it('정지 회원은 체크한 종류만 최신 퇴장순', () => {
		expect(filterSuspendedMembers(members, { withdrawn: true, kicked: true }).map(m => m.userKey)).toEqual([5, 4]);
		expect(filterSuspendedMembers(members, { withdrawn: true, kicked: false }).map(m => m.userKey)).toEqual([4]);
	});

	it('역할 변경은 리더만, 리더 본인 행 제외 / 내보내기는 활동 일반회원만', () => {
		expect(canChangeRole(member(3, 'MANAGER'), true)).toBe(true);
		expect(canChangeRole(member(2, 'LEADER'), true)).toBe(false);
		expect(canChangeRole(member(3, 'MANAGER'), false)).toBe(false);
		expect(canKick(member(1, 'MEMBER'))).toBe(true);
		expect(canKick(member(3, 'MANAGER'))).toBe(false);
		expect(canKick(member(4, 'MEMBER', 'WITHDRAWN'))).toBe(false);
	});
});

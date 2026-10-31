import { GROUP_ROLE, MEMBER_STATUS } from '@/types/Member';
import type { GroupMember, GroupRole } from '@/types/Member';

export const ROLE_LABEL = { LEADER: '리더', MANAGER: '매니저', MEMBER: '일반회원' } as const satisfies Record<
	GroupRole,
	string
>;

const ROLE_ORDER = { LEADER: 0, MANAGER: 1, MEMBER: 2 } as const satisfies Record<GroupRole, number>;

export const getMemberName = (member: Pick<GroupMember, 'displayName' | 'userKey'>): string =>
	member.displayName || `사용자 #${member.userKey}`;

export const isActiveMember = (member: GroupMember): boolean => member.status === MEMBER_STATUS.ACTIVE;

/** 활동 회원: 리더 → 매니저 → 일반 순 */
export const sortActiveMembers = (members: readonly GroupMember[]): GroupMember[] =>
	members.filter(isActiveMember).sort((a, b) => ROLE_ORDER[a.role] - ROLE_ORDER[b.role]);

/** 정지(탈퇴·추방) 회원: 체크한 종류만, 나간 날짜 최신순 */
export const filterSuspendedMembers = (
	members: readonly GroupMember[],
	show: { withdrawn: boolean; kicked: boolean },
): GroupMember[] =>
	members
		.filter(
			member =>
				(show.withdrawn && member.status === MEMBER_STATUS.WITHDRAWN) ||
				(show.kicked && member.status === MEMBER_STATUS.KICKED),
		)
		.sort((a, b) => new Date(b.leftAt ?? 0).getTime() - new Date(a.leftAt ?? 0).getTime());

/** 리더만 역할을 바꿀 수 있고, 리더 본인 행은 승계로만 바뀐다 */
export const canChangeRole = (member: GroupMember, viewerIsLeader: boolean): boolean =>
	viewerIsLeader && isActiveMember(member) && member.role !== GROUP_ROLE.LEADER;

/** 매니저 이상이 활동 중인 일반회원을 내보낼 수 있다 */
export const canKick = (member: GroupMember): boolean => isActiveMember(member) && member.role === GROUP_ROLE.MEMBER;

/** 모임이 회원의 닉네임 수정을 막아 두었을 때(allow_self_nickname=0) 보여줄 안내 */
export const NICKNAME_LOCKED_MESSAGE = '이 모임은 모임장이 닉네임을 관리해요. 바꾸려면 모임장에게 요청하세요.';

/** 내 모임 닉네임을 직접 바꿀 수 있는지 — 모임이 허용했거나 내가 모임장·매니저(서버 GroupManageService.canEditOwnNickname) */
export const canEditOwnNickname = (params: { allowSelfNickname: boolean | null; role: GroupRole | null }): boolean =>
	!!params.allowSelfNickname || params.role === GROUP_ROLE.LEADER || params.role === GROUP_ROLE.MANAGER;

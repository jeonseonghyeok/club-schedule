export const GROUP_ROLE = { LEADER: 'LEADER', MANAGER: 'MANAGER', MEMBER: 'MEMBER' } as const;
export type GroupRole = (typeof GROUP_ROLE)[keyof typeof GROUP_ROLE];

export const MEMBER_STATUS = { ACTIVE: 'ACTIVE', WITHDRAWN: 'WITHDRAWN', KICKED: 'KICKED' } as const;
export type MemberStatus = (typeof MEMBER_STATUS)[keyof typeof MEMBER_STATUS];

/** 매니저에게 줄 수 있는 권한 묶음 */
export const PERMISSION_PRESET = {
	SCHEDULE_MANAGER: 'SCHEDULE_MANAGER',
	ATTENDANCE_MANAGER: 'ATTENDANCE_MANAGER',
} as const;
export type PermissionPreset = (typeof PERMISSION_PRESET)[keyof typeof PERMISSION_PRESET];

export interface GroupMember {
	readonly userKey: number;
	/** 모임 닉네임이 있으면 그것, 없으면 계정 닉네임 */
	readonly displayName: string | null;
	/** 이 모임에서만 쓰는 닉네임(없으면 null) */
	readonly groupNickname: string | null;
	readonly role: GroupRole;
	readonly status: MemberStatus;
	readonly joinedAt: string | null;
	readonly leftAt: string | null;
	/** 재가입 차단 여부 */
	readonly banned: boolean;
	readonly banReason: string | null;
	readonly presets: readonly PermissionPreset[] | null;
}

/** PATCH /api/groups/{groupId}/members/me/nickname 응답 */
export interface MyNickname {
	readonly groupNickname: string | null;
}

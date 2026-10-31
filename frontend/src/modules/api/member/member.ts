import type { GroupMember, GroupRole, MyNickname, PermissionPreset } from '@/types/Member';
import type { NicknameHistory } from '@/types/Nickname';
import { memberApi } from '.';

interface MemberTarget {
	readonly groupId: number;
	readonly userKey: number;
}

const memberPath = (target: MemberTarget): string => `/api/groups/${target.groupId}/members/${target.userKey}`;

/** 활동·탈퇴·추방 회원 모두 */
export const getMembers = async (groupId: number): Promise<GroupMember[]> => {
	const { data } = await memberApi.get<GroupMember[]>(`/api/groups/${groupId}/members`);
	return data;
};

/** LEADER 로 바꾸면 리더 승계(본인은 매니저가 된다) */
export const updateMemberRole = async (target: MemberTarget & { role: GroupRole }): Promise<void> => {
	await memberApi.patch(`${memberPath(target)}/role`, { role: target.role });
};

export const updateMemberPermissions = async (
	target: MemberTarget & { presets: readonly PermissionPreset[] },
): Promise<void> => {
	await memberApi.put(`${memberPath(target)}/permissions`, { presets: target.presets });
};

/** 활동 회원이면 내보내기, 이미 나간 회원이면 재가입 차단 */
export const updateMemberBan = async (target: MemberTarget & { reason: string }): Promise<void> => {
	await memberApi.patch(`${memberPath(target)}/ban`, { reason: target.reason || null });
};

export const deleteMemberBan = async (target: MemberTarget): Promise<void> => {
	await memberApi.delete(`${memberPath(target)}/ban`);
};

/** 본인 탈퇴 — 리더는 409(먼저 리더 승계) */
export const deleteMyMembership = async (groupId: number): Promise<void> => {
	await memberApi.delete(`/api/groups/${groupId}/members/me`);
};

/** 회원의 모임 닉네임(모임장·매니저) — 빈 문자열이면 그 회원의 계정 닉네임으로 맞춘다 */
export const updateMemberNickname = async (target: MemberTarget & { nickname: string }): Promise<MyNickname> => {
	const { data } = await memberApi.patch<MyNickname>(`${memberPath(target)}/nickname`, { nickname: target.nickname });
	return data;
};

/** 회원의 이 모임 닉네임 변경 이력(본인 또는 모임장·매니저) */
export const getMemberNicknameHistory = async (target: MemberTarget): Promise<NicknameHistory[]> => {
	const { data } = await memberApi.get<NicknameHistory[]>(`${memberPath(target)}/nickname-history`);
	return data;
};

/** 내 모임 닉네임 — 빈 문자열이면 지금 계정 닉네임으로 맞춘다 */
export const updateMyNickname = async (params: { groupId: number; nickname: string }): Promise<MyNickname> => {
	const { data } = await memberApi.patch<MyNickname>(`/api/groups/${params.groupId}/members/me/nickname`, {
		nickname: params.nickname,
	});
	return data;
};

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ModalType } from '@/constants';
import {
	deleteMemberBan,
	deleteMyMembership,
	updateMemberBan,
	updateMemberPermissions,
	updateMemberRole,
} from '@/modules/api/member/member';
import { useModalStore } from '@/modules/stores/client/modal';
import { authQueries } from '@/modules/stores/server/auth/queries';
import { groupQueries } from '@/modules/stores/server/group/queries';
import { GROUP_ROLE, MEMBER_STATUS } from '@/types/Member';
import type { GroupMember, GroupRole, PermissionPreset } from '@/types/Member';
import { getErrorMessage } from '@/utils';
import { toLocalDateTimeString } from '@/utils/date';
import { memberQueries } from './queries';

const useUpdateMemberCache = (groupId: number) => {
	const queryClient = useQueryClient();
	return (userKey: number, update: (member: GroupMember) => GroupMember) =>
		queryClient.setQueryData(memberQueries.list(groupId).queryKey, prev =>
			prev?.map(member => (member.userKey === userKey ? update(member) : member)),
		);
};

const useAlertError = () => {
	const openModal = useModalStore(state => state.actions.openModal);
	return (data: Parameters<typeof getErrorMessage>[0], fallback: string) =>
		openModal({ type: ModalType.ALERT, message: getErrorMessage(data, fallback) });
};

export const useChangeMemberRole = (groupId: number) => {
	const queryClient = useQueryClient();
	const updateCache = useUpdateMemberCache(groupId);
	const alertError = useAlertError();

	return useMutation({
		mutationFn: (params: { userKey: number; role: GroupRole }) => updateMemberRole({ groupId, ...params }),
		onSuccess: (_, { userKey, role }) => {
			updateCache(userKey, member => ({ ...member, role }));
			// 리더 승계면 내 권한이 바뀌므로(리더 → 매니저) 모임 정보·회원 목록을 새로 받는다
			if (role === GROUP_ROLE.LEADER) {
				void queryClient.invalidateQueries({ queryKey: groupQueries.detail(groupId).queryKey });
				void queryClient.invalidateQueries({ queryKey: memberQueries.list(groupId).queryKey });
			}
		},
		onError: error => alertError(error.response?.data, '역할 변경에 실패했습니다.'),
	});
};

export const useSetMemberPermissions = (groupId: number) => {
	const updateCache = useUpdateMemberCache(groupId);
	const alertError = useAlertError();

	return useMutation({
		mutationFn: (params: { userKey: number; presets: readonly PermissionPreset[] }) =>
			updateMemberPermissions({ groupId, ...params }),
		onSuccess: (_, { userKey, presets }) => updateCache(userKey, member => ({ ...member, presets })),
		onError: error => alertError(error.response?.data, '권한 변경에 실패했습니다.'),
	});
};

/** 활동 회원이면 내보내기(KICKED), 이미 나간 회원이면 재가입 차단 */
export const useBanMember = (groupId: number) => {
	const queryClient = useQueryClient();
	const updateCache = useUpdateMemberCache(groupId);
	const alertError = useAlertError();

	return useMutation({
		mutationFn: (params: { userKey: number; reason: string }) => updateMemberBan({ groupId, ...params }),
		onSuccess: (_, { userKey, reason }) => {
			updateCache(userKey, member =>
				member.status === MEMBER_STATUS.ACTIVE
					? {
							...member,
							status: MEMBER_STATUS.KICKED,
							leftAt: toLocalDateTimeString(new Date()),
							banReason: reason || null,
						}
					: { ...member, banned: true, banReason: reason || null },
			);
			// 서버가 내보내기와 차단을 함께 처리할 수 있어 정확한 상태를 다시 받는다
			void queryClient.invalidateQueries({ queryKey: memberQueries.list(groupId).queryKey });
		},
		onError: error => alertError(error.response?.data, '처리에 실패했습니다.'),
	});
};

export const useUnbanMember = (groupId: number) => {
	const updateCache = useUpdateMemberCache(groupId);
	const alertError = useAlertError();

	return useMutation({
		mutationFn: (userKey: number) => deleteMemberBan({ groupId, userKey }),
		onSuccess: (_, userKey) => updateCache(userKey, member => ({ ...member, banned: false, banReason: null })),
		onError: error => alertError(error.response?.data, '벤 해제에 실패했습니다.'),
	});
};

/** 본인 탈퇴 — 모임 권한·내 모임 목록·우선모임(서버가 해제)이 바뀌므로 다시 받는다 */
export const useWithdrawGroup = (groupId: number) => {
	const queryClient = useQueryClient();
	const alertError = useAlertError();

	return useMutation({
		mutationFn: () => deleteMyMembership(groupId),
		onSuccess: () => {
			queryClient.removeQueries({ queryKey: memberQueries.list(groupId).queryKey });
			void queryClient.invalidateQueries({ queryKey: groupQueries.all() });
			void queryClient.invalidateQueries({ queryKey: authQueries.me().queryKey });
		},
		onError: error => alertError(error.response?.data, '탈퇴에 실패했습니다.'),
	});
};

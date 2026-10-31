import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ModalType } from '@/constants';
import { updateAccountNickname } from '@/modules/api/user/user';
import { useModalStore } from '@/modules/stores/client/modal';
import { attendanceQueries } from '@/modules/stores/server/attendance/queries';
import { authQueries } from '@/modules/stores/server/auth/queries';
import { groupQueries } from '@/modules/stores/server/group/queries';
import { memberQueries } from '@/modules/stores/server/member/queries';
import type { AccountNicknameRequest } from '@/types/Auth';
import { getErrorMessage } from '@/utils';
import { userQueries } from './queries';

/** 계정 닉네임(+ 고른 모임 닉네임) — 바뀐 모임의 회원·참가 명단과 이력은 다시 받는다 */
export const useUpdateAccountNickname = () => {
	const queryClient = useQueryClient();
	const openModal = useModalStore(state => state.actions.openModal);

	return useMutation({
		mutationFn: (request: AccountNicknameRequest) => updateAccountNickname(request),
		onSuccess: ({ nickname, updated }) => {
			queryClient.setQueryData(authQueries.me().queryKey, prev => (prev ? { ...prev, nickname } : prev));
			const savedByGroup = new Map(updated.map(row => [row.groupId, row.groupNickname]));
			queryClient.setQueryData(groupQueries.myGroups().queryKey, prev =>
				prev?.map(group => {
					const saved = savedByGroup.get(group.groupId);
					return saved === undefined ? group : { ...group, myNickname: saved };
				}),
			);
			savedByGroup.forEach((_, groupId) => {
				void queryClient.invalidateQueries({ queryKey: memberQueries.list(groupId).queryKey });
				void queryClient.invalidateQueries({ queryKey: attendanceQueries.ofGroup(groupId) });
			});
			void queryClient.invalidateQueries({ queryKey: userQueries.all() });
		},
		onError: error =>
			openModal({
				type: ModalType.ALERT,
				message: getErrorMessage(error.response?.data, '닉네임 저장에 실패했습니다.'),
			}),
	});
};

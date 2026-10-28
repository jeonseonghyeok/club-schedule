import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ModalType } from '@/constants';
import { updateAccountNickname } from '@/modules/api/user/user';
import { useModalStore } from '@/modules/stores/client/modal';
import { attendanceQueries } from '@/modules/stores/server/attendance/queries';
import { authQueries } from '@/modules/stores/server/auth/queries';
import { memberQueries } from '@/modules/stores/server/member/queries';
import { getErrorMessage } from '@/utils';

/** 계정 닉네임 — 모임 닉네임이 없는 곳의 표시 이름도 바뀌므로 회원·참가 명단을 다시 받는다 */
export const useUpdateAccountNickname = () => {
	const queryClient = useQueryClient();
	const openModal = useModalStore(state => state.actions.openModal);

	return useMutation({
		mutationFn: (nickname: string) => updateAccountNickname(nickname),
		onSuccess: ({ nickname }) => {
			queryClient.setQueryData(authQueries.me().queryKey, prev => (prev ? { ...prev, nickname } : prev));
			void queryClient.invalidateQueries({ queryKey: memberQueries.all() });
			void queryClient.invalidateQueries({ queryKey: attendanceQueries.all() });
		},
		onError: error =>
			openModal({
				type: ModalType.ALERT,
				message: getErrorMessage(error.response?.data, '닉네임 저장에 실패했습니다.'),
			}),
	});
};

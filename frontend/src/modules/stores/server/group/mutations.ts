import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ModalType } from '@/constants';
import { createGroupFavorite, deleteGroupFavorite } from '@/modules/api/group/group';
import { useModalStore } from '@/modules/stores/client/modal';
import { authQueries } from '@/modules/stores/server/auth/queries';
import { getErrorMessage } from '@/utils';
import { groupQueries } from './queries';

export const FAVORITE_ACTION = { SET: 'SET', CLEAR: 'CLEAR' } as const;
export type FavoriteAction = (typeof FAVORITE_ACTION)[keyof typeof FAVORITE_ACTION];

export const useToggleGroupFavorite = (groupId: number) => {
	const queryClient = useQueryClient();
	const openModal = useModalStore(state => state.actions.openModal);

	return useMutation({
		mutationFn: (action: FavoriteAction) =>
			action === FAVORITE_ACTION.SET ? createGroupFavorite(groupId) : deleteGroupFavorite(groupId),
		onSuccess: (_, action) => {
			const isFavorite = action === FAVORITE_ACTION.SET;
			queryClient.setQueryData(groupQueries.detail(groupId).queryKey, prev =>
				prev
					? { ...prev, viewer: { ...prev.viewer, isFavoriteGroup: isFavorite, hasFavoriteGroup: isFavorite } }
					: prev,
			);
			// 메인 화면의 즐겨찾기 표시·자동 이동도 같은 값을 쓴다
			queryClient.setQueryData(authQueries.me().queryKey, prev =>
				prev ? { ...prev, favoriteGroupId: isFavorite ? groupId : null } : prev,
			);
		},
		onError: error =>
			openModal({ type: ModalType.ALERT, message: getErrorMessage(error.response?.data, '요청 처리에 실패했습니다.') }),
	});
};

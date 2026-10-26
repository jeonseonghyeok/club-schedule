import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ModalType } from '@/constants';
import { createGroupFavorite, deleteGroupFavorite, updateGroup, updateGroupPolicy } from '@/modules/api/group/group';
import { useModalStore } from '@/modules/stores/client/modal';
import { authQueries } from '@/modules/stores/server/auth/queries';
import type { GroupInfoPayload, GroupPolicy, GroupSettings } from '@/types/GroupSettings';
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

/** 기본 정보 저장 — 설정 캐시와 모임 화면(이름·설명)·내 모임 목록에 바로 반영한다 */
export const useUpdateGroupInfo = (groupId: number) => {
	const queryClient = useQueryClient();
	const openModal = useModalStore(state => state.actions.openModal);

	return useMutation({
		mutationFn: (payload: GroupInfoPayload) => updateGroup({ groupId, payload }),
		onSuccess: (settings: GroupSettings) => {
			queryClient.setQueryData(groupQueries.settings(groupId).queryKey, settings);
			queryClient.setQueryData(groupQueries.detail(groupId).queryKey, prev =>
				prev
					? {
							...prev,
							group: {
								...prev.group,
								name: settings.name,
								description: settings.description,
								capacity: settings.capacity,
								autoApprove: settings.autoApprove,
							},
						}
					: prev,
			);
			queryClient.setQueryData(groupQueries.myGroups().queryKey, prev =>
				prev?.map(group =>
					group.groupId === groupId
						? { ...group, name: settings.name, description: settings.description, capacity: settings.capacity }
						: group,
				),
			);
		},
		onError: error =>
			openModal({
				type: ModalType.ALERT,
				message: getErrorMessage(error.response?.data, '모임 정보 저장에 실패했습니다.'),
			}),
	});
};

/** 운영 정책 저장(리더) — 내 일정 권한·공개 범위가 바뀔 수 있어 모임 정보는 다시 받는다 */
export const useUpdateGroupPolicy = (groupId: number) => {
	const queryClient = useQueryClient();
	const openModal = useModalStore(state => state.actions.openModal);

	return useMutation({
		mutationFn: (policy: GroupPolicy) => updateGroupPolicy({ groupId, policy }),
		onSuccess: (settings: GroupSettings) => {
			queryClient.setQueryData(groupQueries.settings(groupId).queryKey, settings);
			void queryClient.invalidateQueries({ queryKey: groupQueries.detail(groupId).queryKey });
		},
		onError: error =>
			openModal({
				type: ModalType.ALERT,
				message: getErrorMessage(error.response?.data, '운영 정책 저장에 실패했습니다.'),
			}),
	});
};

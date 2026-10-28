import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ModalType } from '@/constants';
import {
	createGroupFavorite,
	deleteGroupFavorite,
	updateGroup,
	updateGroupPolicy,
	updateGroupRegion,
} from '@/modules/api/group/group';
import { useModalStore } from '@/modules/stores/client/modal';
import { authQueries } from '@/modules/stores/server/auth/queries';
import { mapQueries } from '@/modules/stores/server/map/queries';
import type { GroupInfoPayload, GroupPolicy, GroupRegionPayload, GroupSettings } from '@/types/GroupSettings';
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
								allowSelfNickname: settings.allowSelfNickname,
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

/** 설정 탭: 우선모임을 고르거나(next) 해제(null) — 바꾸면 모임 화면의 별 표시도 달라진다 */
export const useUpdateFavoriteGroup = () => {
	const queryClient = useQueryClient();
	const openModal = useModalStore(state => state.actions.openModal);

	return useMutation({
		mutationFn: (params: { next: number | null; current: number | null }) => {
			if (params.next !== null) return createGroupFavorite(params.next);
			return params.current !== null ? deleteGroupFavorite(params.current) : Promise.resolve();
		},
		onSuccess: (_, { next }) => {
			queryClient.setQueryData(authQueries.me().queryKey, prev => (prev ? { ...prev, favoriteGroupId: next } : prev));
			void queryClient.invalidateQueries({ queryKey: [...groupQueries.all(), 'detail'] });
		},
		onError: error =>
			openModal({
				type: ModalType.ALERT,
				message: getErrorMessage(error.response?.data, '우선모임 변경에 실패했습니다.'),
			}),
	});
};

/** 활동 지역 — 모임 화면 머리 카드·내 모임 목록·지도 탭에 반영 */
export const useUpdateGroupRegion = (groupId: number) => {
	const queryClient = useQueryClient();
	const openModal = useModalStore(state => state.actions.openModal);

	return useMutation({
		mutationFn: (region: GroupRegionPayload) => updateGroupRegion({ groupId, region }),
		onSuccess: (settings: GroupSettings) => {
			queryClient.setQueryData(groupQueries.settings(groupId).queryKey, settings);
			queryClient.setQueryData(groupQueries.detail(groupId).queryKey, prev =>
				prev ? { ...prev, group: { ...prev.group, regionName: settings.regionName } } : prev,
			);
			queryClient.setQueryData(groupQueries.myGroups().queryKey, prev =>
				prev?.map(group => (group.groupId === groupId ? { ...group, regionName: settings.regionName } : group)),
			);
			void queryClient.invalidateQueries({ queryKey: mapQueries.all() });
		},
		onError: error =>
			openModal({
				type: ModalType.ALERT,
				message: getErrorMessage(error.response?.data, '활동 지역 저장에 실패했습니다.'),
			}),
	});
};

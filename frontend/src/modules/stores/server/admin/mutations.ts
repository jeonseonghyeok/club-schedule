import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { QueryClient } from '@tanstack/react-query';
import { ModalType } from '@/constants';
import {
	createGroupJoinApproval,
	createGroupJoinRejection,
	createGroupRequestApproval,
	createGroupRequestRejection,
	updateAdminGroupApp,
} from '@/modules/api/admin/admin';
import { useModalStore } from '@/modules/stores/client/modal';
import { groupQueries } from '@/modules/stores/server/group/queries';
import type { AdminGroup, AdminGroupJoin, AdminGroupRequest, RejectionParams } from '@/types/Admin';
import { GROUP_REQUEST_STATUS } from '@/types/GroupRequest';
import type { GroupRequestStatus } from '@/types/GroupRequest';
import type { Paging } from '@/types/Paging';
import { getErrorMessage } from '@/utils';
import { DEFAULT_APP_COLOR, getIconLetter, renderAppIconPng } from '@/utils/appIcon';
import { toLocalDateTimeString } from '@/utils/date';
import { adminQueries } from './queries';

// 관리자 목록은 서버에서 상태 필터·페이지를 나누므로, 처리한 항목을 캐시에 바로 반영한 뒤
// (승인대기 필터에서 빠지는 등) 페이지 구성이 바뀔 수 있어 다시 조회한다.

const setGroupRequestStatus = (
	queryClient: QueryClient,
	params: { requestId: number; status: GroupRequestStatus; rejectReason?: string },
) => {
	const statusUpdatedAt = toLocalDateTimeString(new Date());
	queryClient.setQueriesData<Paging<AdminGroupRequest>>({ queryKey: adminQueries.groupRequestsAll() }, prev =>
		prev
			? {
					...prev,
					items: prev.items.map(item =>
						item.requestId === params.requestId
							? {
									...item,
									status: params.status,
									statusUpdatedAt,
									rejectReason: params.rejectReason ?? item.rejectReason,
								}
							: item,
					),
				}
			: prev,
	);
	return queryClient.invalidateQueries({ queryKey: adminQueries.groupRequestsAll() });
};

/** 가입 요청 목록은 승인대기만 보여주므로 처리한 요청은 목록에서 뺀다 */
const removeGroupJoin = (queryClient: QueryClient, requestId: number) => {
	queryClient.setQueriesData<Paging<AdminGroupJoin>>({ queryKey: adminQueries.groupJoinsAll() }, prev =>
		prev
			? {
					...prev,
					totalCount: prev.totalCount - 1,
					items: prev.items.filter(item => item.requestId !== requestId),
				}
			: prev,
	);
	return queryClient.invalidateQueries({ queryKey: adminQueries.groupJoinsAll() });
};

const useAlertOnError = () => {
	const openModal = useModalStore(state => state.actions.openModal);
	return (error: Parameters<typeof getErrorMessage>[0]) =>
		openModal({ type: ModalType.ALERT, message: getErrorMessage(error) });
};

export const useApproveGroupRequest = () => {
	const queryClient = useQueryClient();
	const alertError = useAlertOnError();

	return useMutation({
		mutationFn: (requestId: number) => createGroupRequestApproval(requestId),
		onSuccess: (_, requestId) =>
			setGroupRequestStatus(queryClient, { requestId, status: GROUP_REQUEST_STATUS.APPROVED }),
		onError: error => alertError(error.response?.data),
	});
};

export const useRejectGroupRequest = () => {
	const queryClient = useQueryClient();
	const alertError = useAlertOnError();

	return useMutation({
		mutationFn: (params: RejectionParams) => createGroupRequestRejection(params),
		onSuccess: (_, { requestId, rejectReason }) =>
			setGroupRequestStatus(queryClient, { requestId, status: GROUP_REQUEST_STATUS.REJECTED, rejectReason }),
		onError: error => alertError(error.response?.data),
	});
};

export const useApproveGroupJoin = () => {
	const queryClient = useQueryClient();
	const alertError = useAlertOnError();

	return useMutation({
		mutationFn: (requestId: number) => createGroupJoinApproval(requestId),
		onSuccess: (_, requestId) => removeGroupJoin(queryClient, requestId),
		onError: error => alertError(error.response?.data),
	});
};

export const useRejectGroupJoin = () => {
	const queryClient = useQueryClient();
	const alertError = useAlertOnError();

	return useMutation({
		mutationFn: (params: RejectionParams) => createGroupJoinRejection(params),
		onSuccess: (_, { requestId }) => removeGroupJoin(queryClient, requestId),
		onError: error => alertError(error.response?.data),
	});
};

/** 모임 전용 앱 켜기/끄기 — 켤 때는 모임 이름 첫 글자로 기본 아이콘을 그려 함께 올린다 */
export const useToggleGroupApp = () => {
	const queryClient = useQueryClient();
	const openModal = useModalStore(state => state.actions.openModal);

	return useMutation({
		mutationFn: async (params: { group: AdminGroup; enabled: boolean }) => {
			const { group, enabled } = params;
			const iconPng = enabled
				? await renderAppIconPng({
						letter: getIconLetter(group.appName ?? group.name),
						color: group.appThemeColor ?? DEFAULT_APP_COLOR,
					})
				: null;
			await updateAdminGroupApp({ groupId: group.groupId, enabled, iconPng });
		},
		onSuccess: (_, { group, enabled }) => {
			queryClient.setQueriesData<Paging<AdminGroup>>({ queryKey: [...adminQueries.all(), 'groups'] }, prev =>
				prev
					? {
							...prev,
							items: prev.items.map(item => (item.groupId === group.groupId ? { ...item, appEnabled: enabled } : item)),
						}
					: prev,
			);
			void queryClient.invalidateQueries({ queryKey: groupQueries.detail(group.groupId).queryKey });
			void queryClient.invalidateQueries({ queryKey: groupQueries.settings(group.groupId).queryKey });
		},
		onError: error =>
			openModal({
				type: ModalType.ALERT,
				message: getErrorMessage(error.response?.data, '전용 앱 설정에 실패했습니다.'),
			}),
	});
};

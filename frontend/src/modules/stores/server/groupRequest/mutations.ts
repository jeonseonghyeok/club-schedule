import { useMutation, useQueryClient } from '@tanstack/react-query';
import { HttpStatusCode } from 'axios';
import { ModalType } from '@/constants';
import { createGroupRequest, updateGroupRequestCancel } from '@/modules/api/groupRequest/groupRequest';
import { useModalStore } from '@/modules/stores/client/modal';
import { GROUP_REQUEST_STATUS } from '@/types/GroupRequest';
import type { GroupRequest, GroupRequestCreatePayload } from '@/types/GroupRequest';
import { getErrorMessage } from '@/utils';
import { toLocalDateTimeString } from '@/utils/date';
import { groupRequestQueries } from './queries';

const CREATE_CONFLICT_MESSAGE = '신청할 수 없는 상태입니다.';

export const useCreateGroupRequest = () => {
	const queryClient = useQueryClient();
	const openModal = useModalStore(state => state.actions.openModal);

	return useMutation({
		mutationFn: (payload: GroupRequestCreatePayload) => createGroupRequest(payload),
		onSuccess: ({ requestId }, payload) => {
			// 응답은 requestId 뿐이지만 서버는 항상 승인대기(PENDING)로 저장한다
			const created: GroupRequest = {
				requestId,
				groupName: payload.groupName,
				description: payload.description,
				requestedAt: toLocalDateTimeString(new Date()),
				status: GROUP_REQUEST_STATUS.PENDING,
				rejectReason: null,
				statusUpdatedAt: null,
				groupId: null,
			};
			queryClient.setQueryData(groupRequestQueries.myRequests().queryKey, prev => (prev ? [created, ...prev] : prev));
		},
		onError: error => {
			const message =
				error.response?.status === HttpStatusCode.Conflict
					? CREATE_CONFLICT_MESSAGE
					: getErrorMessage(error.response?.data);
			openModal({ type: ModalType.ALERT, message });
		},
	});
};

export const useCancelGroupRequest = () => {
	const queryClient = useQueryClient();
	const openModal = useModalStore(state => state.actions.openModal);

	return useMutation({
		mutationFn: (requestId: number) => updateGroupRequestCancel(requestId),
		onSuccess: (_, requestId) => {
			const now = toLocalDateTimeString(new Date());
			queryClient.setQueryData(groupRequestQueries.myRequests().queryKey, prev =>
				prev?.map(request =>
					request.requestId === requestId
						? { ...request, status: GROUP_REQUEST_STATUS.CANCELLED, statusUpdatedAt: now }
						: request,
				),
			);
		},
		onError: error => {
			openModal({ type: ModalType.ALERT, message: getErrorMessage(error.response?.data) });
		},
	});
};

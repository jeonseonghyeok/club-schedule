import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ModalType } from '@/constants';
import {
	createJoinRequest,
	deleteJoinRequest,
	updateJoinApproval,
	updateJoinRejection,
} from '@/modules/api/joinRequest/joinRequest';
import { useModalStore } from '@/modules/stores/client/modal';
import { groupQueries } from '@/modules/stores/server/group/queries';
import { memberQueries } from '@/modules/stores/server/member/queries';
import { JOIN_STATUS } from '@/types/JoinRequest';
import type { JoinRequest } from '@/types/JoinRequest';
import { getErrorMessage } from '@/utils';
import { toLocalDateTimeString } from '@/utils/date';
import { joinRequestQueries } from './queries';

export const useCreateJoinRequest = (params: { groupId: number; userKey: number }) => {
	const queryClient = useQueryClient();
	const openModal = useModalStore(state => state.actions.openModal);

	return useMutation({
		mutationFn: () => createJoinRequest(params.groupId),
		onSuccess: ({ requestId }) => {
			const created: JoinRequest = {
				requestId,
				userKey: params.userKey,
				nickname: null,
				status: JOIN_STATUS.PENDING,
				requestedAt: toLocalDateTimeString(new Date()),
				rejectReason: null,
			};
			queryClient.setQueryData(joinRequestQueries.mine(params.groupId).queryKey, prev => [created, ...(prev ?? [])]);
			openModal({ type: ModalType.ALERT, message: '가입 신청이 완료되었습니다.' });
		},
		onError: error =>
			openModal({ type: ModalType.ALERT, message: getErrorMessage(error.response?.data, '가입 신청에 실패했습니다.') }),
	});
};

export const useCancelJoinRequest = (groupId: number) => {
	const queryClient = useQueryClient();
	const openModal = useModalStore(state => state.actions.openModal);

	return useMutation({
		mutationFn: (requestId: number) => deleteJoinRequest({ groupId, requestId }),
		onSuccess: (_, requestId) =>
			queryClient.setQueryData(joinRequestQueries.mine(groupId).queryKey, prev =>
				prev?.map(request =>
					request.requestId === requestId ? { ...request, status: JOIN_STATUS.CANCELLED } : request,
				),
			),
		onError: error =>
			openModal({ type: ModalType.ALERT, message: getErrorMessage(error.response?.data, '취소에 실패했습니다.') }),
	});
};

/** 리더: 가입 승인·거부 — 처리한 요청은 대기 목록에서 빼고, 승인이면 회원 목록·인원을 다시 받는다 */
const useRemovePendingJoin = (groupId: number) => {
	const queryClient = useQueryClient();
	return (requestId: number) =>
		queryClient.setQueryData(joinRequestQueries.pending(groupId).queryKey, prev =>
			prev?.filter(request => request.requestId !== requestId),
		);
};

export const useApproveJoinRequest = (groupId: number) => {
	const queryClient = useQueryClient();
	const removePending = useRemovePendingJoin(groupId);
	const openModal = useModalStore(state => state.actions.openModal);

	return useMutation({
		mutationFn: (requestId: number) => updateJoinApproval(requestId),
		onSuccess: (_, requestId) => {
			removePending(requestId);
			void queryClient.invalidateQueries({ queryKey: memberQueries.list(groupId).queryKey });
			void queryClient.invalidateQueries({ queryKey: groupQueries.detail(groupId).queryKey });
		},
		onError: error =>
			openModal({ type: ModalType.ALERT, message: getErrorMessage(error.response?.data, '승인에 실패했습니다.') }),
	});
};

export const useRejectJoinRequest = (groupId: number) => {
	const removePending = useRemovePendingJoin(groupId);
	const openModal = useModalStore(state => state.actions.openModal);

	return useMutation({
		mutationFn: (params: { requestId: number; rejectReason: string }) => updateJoinRejection(params),
		onSuccess: (_, { requestId }) => removePending(requestId),
		onError: error =>
			openModal({ type: ModalType.ALERT, message: getErrorMessage(error.response?.data, '거부에 실패했습니다.') }),
	});
};

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ModalType } from '@/constants';
import { createSchedule, updateSchedule, updateScheduleStatus } from '@/modules/api/schedule/schedule';
import { useModalStore } from '@/modules/stores/client/modal';
import type { Schedule, ScheduleAction, ScheduleEditPayload, SchedulePayload } from '@/types/Schedule';
import { getErrorMessage } from '@/utils';
import { scheduleQueries } from './queries';

/** 서버가 돌려준 일정으로 캐시 항목을 바꾼다(목록 조회에만 있는 집계 값은 유지) */
const useReplaceScheduleInCache = (groupId: number) => {
	const queryClient = useQueryClient();
	return (updated: Schedule) =>
		queryClient.setQueryData(scheduleQueries.list(groupId).queryKey, prev =>
			prev?.map(schedule =>
				schedule.id === updated.id
					? {
							...schedule,
							...updated,
							confirmedCount: updated.confirmedCount ?? schedule.confirmedCount,
							myAttendanceStatus: updated.myAttendanceStatus ?? schedule.myAttendanceStatus,
						}
					: schedule,
			),
		);
};

export const useCreateSchedule = (groupId: number) => {
	const queryClient = useQueryClient();
	const openModal = useModalStore(state => state.actions.openModal);

	return useMutation({
		mutationFn: (payload: SchedulePayload) => createSchedule({ groupId, payload }),
		onSuccess: created => {
			queryClient.setQueryData(scheduleQueries.list(groupId).queryKey, prev => (prev ? [...prev, created] : prev));
			// 승인 필요 여부·집계는 서버 기준으로 맞춘다
			void queryClient.invalidateQueries({ queryKey: scheduleQueries.list(groupId).queryKey });
		},
		onError: error =>
			openModal({ type: ModalType.ALERT, message: getErrorMessage(error.response?.data, '일정 추가에 실패했습니다.') }),
	});
};

export const useUpdateSchedule = (groupId: number) => {
	const replace = useReplaceScheduleInCache(groupId);
	const openModal = useModalStore(state => state.actions.openModal);

	return useMutation({
		mutationFn: (params: { scheduleId: number; payload: ScheduleEditPayload }) =>
			updateSchedule({ groupId, ...params }),
		onSuccess: replace,
		onError: error =>
			openModal({ type: ModalType.ALERT, message: getErrorMessage(error.response?.data, '일정 수정에 실패했습니다.') }),
	});
};

const ACTION_FAILURE = {
	approve: '일정 승인에 실패했습니다.',
	reject: '일정 거부에 실패했습니다.',
	cancel: '일정 취소에 실패했습니다.',
} as const satisfies Record<ScheduleAction, string>;

export const useChangeScheduleStatus = (groupId: number) => {
	const replace = useReplaceScheduleInCache(groupId);
	const openModal = useModalStore(state => state.actions.openModal);

	return useMutation({
		mutationFn: (params: { scheduleId: number; action: ScheduleAction; reason: string | null }) =>
			updateScheduleStatus({ groupId, ...params }),
		onSuccess: replace,
		onError: (error, { action }) =>
			openModal({ type: ModalType.ALERT, message: getErrorMessage(error.response?.data, ACTION_FAILURE[action]) }),
	});
};

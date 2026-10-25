import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ModalType } from '@/constants';
import {
	createAttendance,
	deleteAttendance,
	deleteAttendee,
	updateAttendeeApproval,
	updateAttendeeCheck,
	updateAttendeeRejection,
} from '@/modules/api/attendance/attendance';
import { useModalStore } from '@/modules/stores/client/modal';
import { scheduleQueries } from '@/modules/stores/server/schedule/queries';
import type { ActualStatus } from '@/types/Schedule';
import { getErrorMessage } from '@/utils';
import { attendanceQueries } from './queries';

/**
 * 참가 상태는 서버가 자동 승인·정원 등을 판단하므로 결과를 예측할 수 없다.
 * 처리 뒤에는(실패 포함 — 이미 처리된 상태일 수 있다) 일정 목록과 해당 일정 명단을 새로 받는다.
 */
const useRefreshAttendance = (groupId: number) => {
	const queryClient = useQueryClient();
	return (scheduleId: number) =>
		Promise.all([
			queryClient.invalidateQueries({ queryKey: scheduleQueries.list(groupId).queryKey }),
			queryClient.invalidateQueries({ queryKey: [...attendanceQueries.ofGroup(groupId), scheduleId] }),
			queryClient.invalidateQueries({ queryKey: attendanceQueries.mine(groupId).queryKey }),
		]);
};

const useAlertError = () => {
	const openModal = useModalStore(state => state.actions.openModal);
	return (data: Parameters<typeof getErrorMessage>[0], fallback: string) =>
		openModal({ type: ModalType.ALERT, message: getErrorMessage(data, fallback) });
};

export const useAttend = (groupId: number) => {
	const refresh = useRefreshAttendance(groupId);
	const alertError = useAlertError();

	return useMutation({
		mutationFn: (scheduleId: number) => createAttendance({ groupId, scheduleId }),
		onSettled: (_, __, scheduleId) => refresh(scheduleId),
		onError: error => alertError(error.response?.data, '참가 신청에 실패했습니다.'),
	});
};

export const useCancelAttendance = (groupId: number) => {
	const refresh = useRefreshAttendance(groupId);
	const alertError = useAlertError();

	return useMutation({
		mutationFn: (scheduleId: number) => deleteAttendance({ groupId, scheduleId }),
		onSettled: (_, __, scheduleId) => refresh(scheduleId),
		onError: error => alertError(error.response?.data, '참가 취소에 실패했습니다.'),
	});
};

interface AttendeeAction {
	readonly scheduleId: number;
	readonly userKey: number;
}

export const ATTENDEE_DECISION = { APPROVE: 'APPROVE', REJECT: 'REJECT', CANCEL: 'CANCEL' } as const;
export type AttendeeDecision = (typeof ATTENDEE_DECISION)[keyof typeof ATTENDEE_DECISION];

const DECISION_REQUEST = {
	APPROVE: updateAttendeeApproval,
	REJECT: updateAttendeeRejection,
	CANCEL: deleteAttendee,
} as const satisfies Record<AttendeeDecision, (target: AttendeeAction & { groupId: number }) => Promise<void>>;

const DECISION_FAILURE = {
	APPROVE: '승인에 실패했습니다.',
	REJECT: '거부에 실패했습니다.',
	CANCEL: '취소에 실패했습니다.',
} as const satisfies Record<AttendeeDecision, string>;

/** 관리자: 참가 신청 승인·거부, 확정 참가 취소 */
export const useDecideAttendee = (groupId: number) => {
	const refresh = useRefreshAttendance(groupId);
	const alertError = useAlertError();

	return useMutation({
		mutationFn: (params: AttendeeAction & { decision: AttendeeDecision }) =>
			DECISION_REQUEST[params.decision]({ groupId, scheduleId: params.scheduleId, userKey: params.userKey }),
		onSettled: (_, __, { scheduleId }) => refresh(scheduleId),
		onError: (error, { decision }) => alertError(error.response?.data, DECISION_FAILURE[decision]),
	});
};

export interface CheckResult {
	readonly failedUserKeys: readonly number[];
}

/**
 * 참석 체크 일괄 저장. 대상별로 따로 요청해 일부만 실패해도 성공분은 반영하고,
 * 실패한 인원을 돌려준다(기존 화면의 Promise.allSettled 동작).
 */
export const useSaveAttendanceChecks = (groupId: number) => {
	const refresh = useRefreshAttendance(groupId);

	return useMutation({
		mutationFn: async (params: {
			scheduleId: number;
			changes: readonly { userKey: number; actualStatus: ActualStatus }[];
		}): Promise<CheckResult> => {
			const settled = await Promise.allSettled(
				params.changes.map(change => updateAttendeeCheck({ groupId, scheduleId: params.scheduleId, ...change })),
			);
			const failedUserKeys = params.changes
				.filter((_, index) => settled[index]?.status === 'rejected')
				.map(change => change.userKey);
			return { failedUserKeys };
		},
		onSettled: (_, __, { scheduleId }) => refresh(scheduleId),
	});
};

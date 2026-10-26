import { ModalType } from '@/constants';
import { useModalStore } from '@/modules/stores/client/modal';
import { useChangeScheduleStatus } from '@/modules/stores/server/schedule/mutations';
import type { ScheduleAction } from '@/types/Schedule';

/** 되돌릴 수 없는 처리(거부·취소)는 사유를 받는다 — 작성자·참가자 알림에 함께 간다. 승인은 바로 처리한다 */
const REASON_PROMPT = {
	approve: null,
	reject: { title: '일정 거부', reasonLabel: '거부 사유', confirmLabel: '거부' },
	cancel: { title: '일정 취소', reasonLabel: '취소 사유', confirmLabel: '일정 취소' },
} as const satisfies Record<ScheduleAction, { title: string; reasonLabel: string; confirmLabel: string } | null>;

const SUCCESS_MESSAGE = {
	approve: '일정이 승인되었습니다.',
	reject: '일정이 거부되었습니다.',
	cancel: '일정이 취소되었습니다.',
} as const satisfies Record<ScheduleAction, string>;

export const useScheduleStatusChange = (groupId: number) => {
	const openModal = useModalStore(state => state.actions.openModal);
	const { mutate } = useChangeScheduleStatus(groupId);

	return (scheduleId: number, action: ScheduleAction) => {
		const run = (reason: string | null) =>
			mutate(
				{ scheduleId, action, reason },
				{ onSuccess: () => openModal({ type: ModalType.ALERT, message: SUCCESS_MESSAGE[action] }) },
			);
		const prompt = REASON_PROMPT[action];
		if (!prompt) {
			run(null);
			return;
		}
		openModal({ type: ModalType.REASON, ...prompt, onSubmit: run });
	};
};

import { ModalType } from '@/constants';
import { useModalStore } from '@/modules/stores/client/modal';
import { useChangeScheduleStatus } from '@/modules/stores/server/schedule/mutations';
import type { ScheduleAction } from '@/types/Schedule';

/** 되돌릴 수 없는 처리(거부·취소)는 한 번 더 묻는다. 승인은 바로 처리한다 */
const CONFIRMATION = {
	approve: null,
	reject: { message: '이 일정을 거부하시겠습니까? 거부 후에는 되돌릴 수 없습니다.', confirmLabel: '거부' },
	cancel: { message: '이 일정을 취소하시겠습니까? 취소 후에는 복구할 수 없습니다.', confirmLabel: '일정 취소' },
} as const satisfies Record<ScheduleAction, { message: string; confirmLabel: string } | null>;

const SUCCESS_MESSAGE = {
	approve: '일정이 승인되었습니다.',
	reject: '일정이 거부되었습니다.',
	cancel: '일정이 취소되었습니다.',
} as const satisfies Record<ScheduleAction, string>;

export const useScheduleStatusChange = (groupId: number) => {
	const openModal = useModalStore(state => state.actions.openModal);
	const { mutate } = useChangeScheduleStatus(groupId);

	return (scheduleId: number, action: ScheduleAction) => {
		const run = () =>
			mutate(
				{ scheduleId, action },
				{ onSuccess: () => openModal({ type: ModalType.ALERT, message: SUCCESS_MESSAGE[action] }) },
			);
		const confirmation = CONFIRMATION[action];
		if (!confirmation) {
			run();
			return;
		}
		openModal({ type: ModalType.CONFIRM, ...confirmation, onConfirm: run });
	};
};

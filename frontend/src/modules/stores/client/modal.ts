import { ModalType } from '@/constants';
import { createStore } from '.';

export interface AlertModal {
	readonly type: typeof ModalType.ALERT;
	readonly message: string;
}

export interface ConfirmModal {
	readonly type: typeof ModalType.CONFIRM;
	readonly message: string;
	readonly confirmLabel: string;
	readonly onConfirm: () => void;
}

/** 사유를 받아 처리하는 확인 창(일정 거부·취소 등) — 사유는 필수 */
export interface ReasonModal {
	readonly type: typeof ModalType.REASON;
	readonly title: string;
	readonly reasonLabel: string;
	readonly confirmLabel: string;
	readonly onSubmit: (reason: string) => void;
}

export type Modal = AlertModal | ConfirmModal | ReasonModal;

export interface ModalStore {
	modal: Modal | null;
	actions: {
		openModal: (modal: Modal) => void;
		closeModal: () => void;
	};
}

export const useModalStore = createStore<ModalStore>(
	set => ({
		modal: null,
		actions: {
			openModal: modal => {
				set({ modal }, false, 'modalStore/openModal');
			},
			closeModal: () => {
				set({ modal: null }, false, 'modalStore/closeModal');
			},
		},
	}),
	'modalStore',
);

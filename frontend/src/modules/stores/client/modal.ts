import { ModalType } from '@/constants';
import { createStore } from '.';

export interface AlertModal {
	readonly type: typeof ModalType.ALERT;
	readonly message: string;
}

export type Modal = AlertModal;

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

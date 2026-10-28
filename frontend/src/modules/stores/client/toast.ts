import { createStore } from '.';

export interface ToastStore {
	/** 화면 아래 잠깐 보이는 안내 — 없으면 null */
	message: string | null;
	/** 같은 문구를 다시 띄울 때도 타이머를 새로 걸기 위한 값 */
	shownAt: number;
	actions: {
		showToast: (message: string) => void;
		hideToast: () => void;
	};
}

export const useToastStore = createStore<ToastStore>(
	set => ({
		message: null,
		shownAt: 0,
		actions: {
			showToast: message => {
				set({ message, shownAt: Date.now() }, false, 'toastStore/showToast');
			},
			hideToast: () => {
				set({ message: null }, false, 'toastStore/hideToast');
			},
		},
	}),
	'toastStore',
);

import { createStore } from '.';

export interface PwaStore {
	/** 브라우저가 설치를 제안할 수 있을 때 받아 둔 이벤트(Chromium 계열만) */
	installPrompt: BeforeInstallPromptEvent | null;
	actions: {
		setInstallPrompt: (event: BeforeInstallPromptEvent | null) => void;
	};
}

export const usePwaStore = createStore<PwaStore>(
	set => ({
		installPrompt: null,
		actions: {
			setInstallPrompt: event => {
				set({ installPrompt: event }, false, 'pwaStore/setInstallPrompt');
			},
		},
	}),
	'pwaStore',
);

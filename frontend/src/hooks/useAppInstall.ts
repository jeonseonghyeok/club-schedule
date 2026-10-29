import { useStandaloneDisplay } from '@/hooks/useStandaloneDisplay';
import { usePwaStore } from '@/modules/stores/client/pwa';

const IOS_PATTERN = /iphone|ipad|ipod/i;

export const INSTALL_KIND = {
	/** 이미 앱으로 실행 중 */
	INSTALLED: 'installed',
	/** 브라우저 설치 창을 띄울 수 있음(Chromium) */
	PROMPT: 'prompt',
	/** iOS Safari — 공유 › 홈 화면에 추가 */
	IOS: 'ios',
	/** 그 밖(설치 창 없음) — 브라우저 메뉴로 설치 */
	MANUAL: 'manual',
} as const;
export type InstallKind = (typeof INSTALL_KIND)[keyof typeof INSTALL_KIND];

interface AppInstall {
	kind: InstallKind;
	/** PROMPT 일 때만 — 설치 창을 띄우고 결과를 기다린다 */
	install: () => Promise<void>;
}

/** 지금 화면의 앱(모요라 또는 모임 전용 앱)을 설치할 수 있는 방법 */
export const useAppInstall = (): AppInstall => {
	const isStandalone = useStandaloneDisplay();
	const installPrompt = usePwaStore(state => state.installPrompt);
	const { setInstallPrompt } = usePwaStore(state => state.actions);

	const install = async () => {
		if (!installPrompt) return;
		await installPrompt.prompt();
		await installPrompt.userChoice;
		// 같은 이벤트로는 다시 띄울 수 없다
		setInstallPrompt(null);
	};

	if (isStandalone) return { kind: INSTALL_KIND.INSTALLED, install };
	if (installPrompt) return { kind: INSTALL_KIND.PROMPT, install };
	if (IOS_PATTERN.test(navigator.userAgent)) return { kind: INSTALL_KIND.IOS, install };
	return { kind: INSTALL_KIND.MANUAL, install };
};

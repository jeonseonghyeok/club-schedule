/** Chromium 의 설치 안내 이벤트(lib.dom 에 아직 없다) */
interface BeforeInstallPromptEvent extends Event {
	readonly platforms: readonly string[];
	readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
	prompt: () => Promise<void>;
}

interface WindowEventMap {
	beforeinstallprompt: BeforeInstallPromptEvent;
}

interface Navigator {
	/** iOS Safari: 홈 화면에 추가해 실행 중이면 true */
	readonly standalone?: boolean;
}

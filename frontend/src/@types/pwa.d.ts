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

/**
 * Android Chrome 의 뒤로가기(시스템 뒤로 제스처)를 기록 없이 받아 내는 API(lib.dom 에 아직 없다).
 * 사용자 활성화가 없어도 하나는 만들 수 있어, 링크로 막 열린 화면의 첫 뒤로가기를 받는 데 쓴다.
 */
interface CloseWatcher extends EventTarget {
	onclose: ((this: CloseWatcher, event: Event) => unknown) | null;
	destroy: () => void;
}

interface CloseWatcherConstructor {
	new (options?: { signal?: AbortSignal }): CloseWatcher;
}

interface Window {
	CloseWatcher?: CloseWatcherConstructor;
}

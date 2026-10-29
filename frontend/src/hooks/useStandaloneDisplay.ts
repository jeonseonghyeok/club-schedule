import { useSyncExternalStore } from 'react';

const STANDALONE_QUERY = '(display-mode: standalone)';

// matchMedia 가 없는 환경(구형 브라우저·테스트)에서는 브라우저 탭으로 본다
const hasMatchMedia = (): boolean => typeof window.matchMedia === 'function';

const subscribe = (onChange: () => void) => {
	if (!hasMatchMedia()) return () => {};
	const media = window.matchMedia(STANDALONE_QUERY);
	media.addEventListener('change', onChange);
	return () => media.removeEventListener('change', onChange);
};

const getSnapshot = (): boolean =>
	(hasMatchMedia() && window.matchMedia(STANDALONE_QUERY).matches) || navigator.standalone === true;

/** 홈 화면에 추가한 앱(PWA)으로 실행 중인지 */
export const useStandaloneDisplay = (): boolean => useSyncExternalStore(subscribe, getSnapshot, () => false);

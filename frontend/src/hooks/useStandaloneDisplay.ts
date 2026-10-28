import { useSyncExternalStore } from 'react';

const STANDALONE_QUERY = '(display-mode: standalone)';

const subscribe = (onChange: () => void) => {
	const media = window.matchMedia(STANDALONE_QUERY);
	media.addEventListener('change', onChange);
	return () => media.removeEventListener('change', onChange);
};

const getSnapshot = (): boolean => window.matchMedia(STANDALONE_QUERY).matches || navigator.standalone === true;

/** 홈 화면에 추가한 앱(PWA)으로 실행 중인지 */
export const useStandaloneDisplay = (): boolean => useSyncExternalStore(subscribe, getSnapshot, () => false);

import { useSyncExternalStore } from 'react';

const subscribe = (onChange: () => void) => {
	window.addEventListener('online', onChange);
	window.addEventListener('offline', onChange);
	return () => {
		window.removeEventListener('online', onChange);
		window.removeEventListener('offline', onChange);
	};
};

/** 브라우저가 알려주는 온라인 여부 */
export const useOnlineStatus = (): boolean =>
	useSyncExternalStore(
		subscribe,
		() => navigator.onLine,
		() => true,
	);

import { useEffect } from 'react';
import { useToastStore } from '@/modules/stores/client/toast';

export const TOAST_DURATION_MS = 2000;

/** 하단 탭바 바로 위에 잠깐 떴다 사라지는 안내(스크린리더에도 읽힌다) */
export const ToastHost = () => {
	const message = useToastStore(state => state.message);
	const shownAt = useToastStore(state => state.shownAt);
	const { hideToast } = useToastStore(state => state.actions);

	useEffect(() => {
		if (!message) return;
		const timer = window.setTimeout(hideToast, TOAST_DURATION_MS);
		return () => window.clearTimeout(timer);
	}, [message, shownAt, hideToast]);

	return (
		<div
			role="status"
			aria-live="polite"
			className="pointer-events-none fixed inset-x-0 bottom-[calc(var(--spacing-tabbar)+env(safe-area-inset-bottom,0px)+0.75rem)] z-50 flex justify-center px-4 md:bottom-6 md:pl-56"
		>
			{message && (
				<p className="rounded-full bg-gray-900/90 px-4 py-2.5 text-sm font-medium text-white shadow-lg">{message}</p>
			)}
		</div>
	);
};

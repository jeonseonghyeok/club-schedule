import { useEffect } from 'react';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { useToastStore } from '@/modules/stores/client/toast';
import { cn } from '@/utils';

export const TOAST_DURATION_MS = 2000;

/** 하단 탭바 바로 위에 잠깐 떴다 사라지는 안내(스크린리더에도 읽힌다) */
export const ToastHost = () => {
	const message = useToastStore(state => state.message);
	const shownAt = useToastStore(state => state.shownAt);
	const { hideToast } = useToastStore(state => state.actions);
	const isOnline = useOnlineStatus();

	useEffect(() => {
		if (!message) return;
		const timer = window.setTimeout(hideToast, TOAST_DURATION_MS);
		return () => window.clearTimeout(timer);
	}, [message, shownAt, hideToast]);

	return (
		<div
			role="status"
			aria-live="polite"
			className={cn(
				'pointer-events-none fixed inset-x-0 z-50 flex justify-center px-4 md:pl-56',
				// 오프라인 안내와 겹치지 않게 그 위로 올린다
				isOnline
					? 'bottom-[calc(var(--spacing-tabbar)+env(safe-area-inset-bottom,0px)+0.75rem)] md:bottom-6'
					: 'bottom-[calc(var(--spacing-tabbar)+env(safe-area-inset-bottom,0px)+3.5rem)] md:bottom-16',
			)}
		>
			{message && (
				<p className="rounded-full bg-gray-900/90 px-4 py-2.5 text-sm font-medium text-white shadow-lg">{message}</p>
			)}
		</div>
	);
};

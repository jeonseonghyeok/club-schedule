import { useOnlineStatus } from '@/hooks/useOnlineStatus';

/** 오프라인이면 하단 탭바 위에 알린다 — 지금 보이는 내용은 마지막으로 받은 것일 수 있다 */
export const OfflineBanner = () => {
	const isOnline = useOnlineStatus();
	if (isOnline) return null;
	return (
		<div className="pointer-events-none fixed inset-x-0 bottom-[calc(var(--spacing-tabbar)+env(safe-area-inset-bottom,0px)+0.75rem)] z-40 flex justify-center px-4 md:bottom-6 md:pl-56">
			<p role="status" className="rounded-full bg-gray-800/95 px-4 py-2 text-xs font-medium text-white shadow-lg">
				인터넷 연결이 없어요 · 마지막으로 본 내용이에요
			</p>
		</div>
	);
};

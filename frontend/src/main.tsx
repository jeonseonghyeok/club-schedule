import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createRouter, RouterProvider } from '@tanstack/react-router';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { usePwaStore } from '@/modules/stores/client/pwa';
import { routeTree } from '@/routeTree.gen';
import '@/styles.css';

const queryClient = new QueryClient();

const router = createRouter({
	routeTree,
	context: { queryClient },
	// 로더 데이터는 TanStack Query 캐시가 관리하므로 라우터 자체 캐시는 끈다
	defaultPreloadStaleTime: 0,
});

declare module '@tanstack/react-router' {
	interface Register {
		router: typeof router;
	}
}

// 홈 화면 설치 안내 이벤트는 앱이 그려지기 전에 올 수 있어 가장 먼저 받아 둔다(설정 탭의 "앱 설치")
window.addEventListener('beforeinstallprompt', event => {
	event.preventDefault();
	usePwaStore.getState().actions.setInstallPrompt(event);
});
window.addEventListener('appinstalled', () => usePwaStore.getState().actions.setInstallPrompt(null));

// 개발 서버에서는 캐시가 수정 사항을 가리므로 운영 빌드에서만 서비스 워커를 쓴다
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
	window.addEventListener('load', () => {
		navigator.serviceWorker.register('/sw.js').catch(() => {});
	});
}

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('#root 요소가 없습니다');

createRoot(rootElement).render(
	<StrictMode>
		<QueryClientProvider client={queryClient}>
			<RouterProvider router={router} />
		</QueryClientProvider>
	</StrictMode>,
);

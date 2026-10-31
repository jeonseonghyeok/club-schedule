import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createRouter, RouterProvider } from '@tanstack/react-router';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { startBackNavigation } from '@/hooks/useAppBackNavigation';
import { RouteError, RouteNotFound } from '@/components/layout/RouteError';
import { usePwaStore } from '@/modules/stores/client/pwa';
import { routeTree } from '@/routeTree.gen';
import '@/styles.css';

// iOS 홈 화면 앱은 "추가할 때 보던 주소"로 시작한다. 실행할 때마다 그 앱의 시작 화면에서 열리게 맞춘다
// (모요라는 '/' — 우선모임이 있으면 그 모임으로, 모임 전용 앱은 '/g/{id}/'). Android 는 manifest start_url 을 따른다.
const IOS_LAUNCH_KEY = 'moyora:launched';
if (navigator.standalone === true) {
	try {
		// 카카오 로그인에서 돌아온 콜백은 그대로 두고, 로그인 뒤 돌아갈 화면도 실행 직후로 보지 않는다 — 시작 화면으로 바꾸면
		// 인가 코드나 보던 화면이 사라진다(iOS 는 다른 사이트를 다녀오면 홈 화면 앱을 새로 열어 sessionStorage 가 비어 있을 수 있다)
		const isLoginReturn = window.location.pathname.startsWith('/login/');
		const isFirstLoad = !sessionStorage.getItem(IOS_LAUNCH_KEY);
		sessionStorage.setItem(IOS_LAUNCH_KEY, '1');
		if (isFirstLoad && !isLoginReturn) {
			const groupApp = /^\/g\/(\d+)\//.exec(window.location.pathname);
			const startPath = groupApp ? `/g/${groupApp[1]}/` : '/';
			if (`${window.location.pathname}${window.location.search}` !== startPath) {
				window.history.replaceState(null, '', startPath);
			}
		}
	} catch {
		// 저장소를 쓸 수 없으면 주소를 그대로 둔다
	}
}

const queryClient = new QueryClient({
	defaultOptions: {
		// 오프라인이어도 요청을 보낸다 — 서비스 워커가 마지막으로 받은 응답을 돌려준다(sw.js).
		// 기본값(online)은 오프라인에서 요청을 멈춰 화면이 로딩 상태로 굳는다.
		queries: { networkMode: 'offlineFirst' },
		// 변경은 오프라인이면 바로 실패시켜 안내한다(멈춘 채 기다리지 않게)
		mutations: { networkMode: 'always' },
	},
});

const router = createRouter({
	routeTree,
	context: { queryClient },
	// 로더 데이터는 TanStack Query 캐시가 관리하므로 라우터 자체 캐시는 끈다
	defaultPreloadStaleTime: 0,
	// 모임 전용 앱의 범위(scope)가 /g/{id}/ 라 끝의 / 를 없애면 앱 범위를 벗어난다
	trailingSlash: 'preserve',
	// 기본(영문 "Something went wrong!") 대신 한국어 안내 — 오프라인이면 연결 안내
	defaultErrorComponent: RouteError,
	defaultNotFoundComponent: RouteNotFound,
});

// 뒤로가기 처리를 첫 렌더 전에 시작한다(Android 는 화면이 데이터를 불러오는 동안 누른 뒤로가기도 받는다)
startBackNavigation(router.history);

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

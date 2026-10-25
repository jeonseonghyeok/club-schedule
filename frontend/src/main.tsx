import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createRouter, RouterProvider } from '@tanstack/react-router';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
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

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('#root 요소가 없습니다');

createRoot(rootElement).render(
	<StrictMode>
		<QueryClientProvider client={queryClient}>
			<RouterProvider router={router} />
		</QueryClientProvider>
	</StrictMode>,
);

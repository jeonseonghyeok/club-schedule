import type { QueryClient } from '@tanstack/react-query';
import { createRootRouteWithContext, Outlet } from '@tanstack/react-router';
import { lazy, Suspense } from 'react';
import { ModalHost } from '@/components/layout/ModalHost';
import { ToastHost } from '@/components/layout/ToastHost';
import { useAppBackNavigation } from '@/hooks/useAppBackNavigation';

export interface RouterContext {
	queryClient: QueryClient;
}

// 개발 빌드에서만 devtools 를 로드한다(운영 번들 제외).
const Devtools = import.meta.env.DEV
	? lazy(async () => {
			const [{ TanStackRouterDevtools }, { ReactQueryDevtools }] = await Promise.all([
				import('@tanstack/react-router-devtools'),
				import('@tanstack/react-query-devtools'),
			]);
			return {
				default: () => (
					<>
						<TanStackRouterDevtools position="bottom-right" />
						<ReactQueryDevtools buttonPosition="bottom-left" />
					</>
				),
			};
		})
	: () => null;

const RootLayout = () => {
	useAppBackNavigation();
	return (
		<>
			<Outlet />
			<ModalHost />
			<ToastHost />
			<Suspense>
				<Devtools />
			</Suspense>
		</>
	);
};

export const Route = createRootRouteWithContext<RouterContext>()({
	component: RootLayout,
});

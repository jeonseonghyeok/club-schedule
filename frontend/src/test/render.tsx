import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import type { ReactElement } from 'react';
import { ModalHost } from '@/components/layout/ModalHost';

/** 컴포넌트 테스트용: 새 QueryClient + 전역 모달 호스트와 함께 렌더 */
export const renderWithProviders = (ui: ReactElement) => {
	const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
	const result = render(
		<QueryClientProvider client={queryClient}>
			{ui}
			<ModalHost />
		</QueryClientProvider>,
	);
	return { ...result, queryClient };
};

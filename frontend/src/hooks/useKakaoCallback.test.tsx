import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { StrictMode } from 'react';
import { useKakaoCallback } from '@/hooks/useKakaoCallback';
import { createKakaoLogin } from '@/modules/api/auth/login';
import { navigateToServerPage } from '@/utils/navigation';

vi.mock('@/modules/api/auth/login', () => ({ createKakaoLogin: vi.fn() }));
vi.mock('@/utils/navigation', async importOriginal => ({
	...(await importOriginal<typeof import('@/utils/navigation')>()),
	navigateToServerPage: vi.fn(),
}));

const createWrapper = () => {
	const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
	const Wrapper = (props: { children: ReactNode }) => (
		<StrictMode>
			<QueryClientProvider client={queryClient}>{props.children}</QueryClientProvider>
		</StrictMode>
	);
	return Wrapper;
};

describe('useKakaoCallback', () => {
	const replace = vi.fn();

	beforeEach(() => {
		vi.mocked(createKakaoLogin).mockReset();
		vi.mocked(navigateToServerPage).mockReset();
		replace.mockReset();
		vi.stubGlobal('location', { ...window.location, origin: 'https://dev.crewhub.store', replace });
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it('인가 코드가 없으면 복귀 경로를 state 에 실어 카카오 인가 페이지로 보낸다', () => {
		const { result } = renderHook(() => useKakaoCallback({ returnTo: '/groups/4' }), { wrapper: createWrapper() });

		expect(result.current.status).toBe('redirecting');
		expect(replace).toHaveBeenCalledTimes(1);
		const authorizeUrl = new URL(String(replace.mock.calls[0]?.[0]));
		expect(authorizeUrl.searchParams.get('redirect_uri')).toBe('https://dev.crewhub.store/login/kakao/login_callback');
		expect(authorizeUrl.searchParams.get('state')).toBe('/groups/4');
	});

	it('StrictMode 에서도 인가 코드를 한 번만 교환하고, 성공하면 state 경로로 이동한다', async () => {
		vi.mocked(createKakaoLogin).mockResolvedValue(undefined);
		const { result } = renderHook(() => useKakaoCallback({ code: 'abc', state: '/groups/4' }), {
			wrapper: createWrapper(),
		});

		await waitFor(() => expect(result.current.status).toBe('success'));
		expect(createKakaoLogin).toHaveBeenCalledTimes(1);
		expect(vi.mocked(createKakaoLogin).mock.calls[0]?.[0]).toEqual({
			code: 'abc',
			redirectUri: 'https://dev.crewhub.store/login/kakao/login_callback',
			returnTo: '/groups/4',
		});
		expect(navigateToServerPage).toHaveBeenCalledWith('/groups/4');
	});

	it('외부 주소가 state 로 오면 메인으로 보낸다', async () => {
		vi.mocked(createKakaoLogin).mockResolvedValue(undefined);
		renderHook(() => useKakaoCallback({ code: 'abc', state: '//evil.com' }), { wrapper: createWrapper() });

		await waitFor(() => expect(navigateToServerPage).toHaveBeenCalledWith('/'));
	});

	it('사용자가 동의를 취소하면 교환하지 않고 cancelled 를 돌려준다', () => {
		const { result } = renderHook(() => useKakaoCallback({ error: 'access_denied' }), { wrapper: createWrapper() });

		expect(result.current.status).toBe('cancelled');
		expect(createKakaoLogin).not.toHaveBeenCalled();
		expect(replace).not.toHaveBeenCalled();
	});

	it('교환에 실패하면 error 상태와 메시지를 돌려준다', async () => {
		vi.mocked(createKakaoLogin).mockRejectedValue(new Error('network'));
		const { result } = renderHook(() => useKakaoCallback({ code: 'abc' }), { wrapper: createWrapper() });

		await waitFor(() => expect(result.current.status).toBe('error'));
		expect(navigateToServerPage).not.toHaveBeenCalled();
	});
});

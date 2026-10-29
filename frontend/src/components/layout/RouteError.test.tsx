import { screen } from '@testing-library/react';
import { AxiosError } from 'axios';
import { RouteError } from '@/components/layout/RouteError';
import { renderWithProviders } from '@/test/render';

vi.mock('@tanstack/react-router', async importOriginal => ({
	...(await importOriginal<typeof import('@tanstack/react-router')>()),
	useRouter: () => ({ invalidate: vi.fn(), history: { location: { state: { __TSR_index: 0 }, pathname: '/' } } }),
}));

describe('RouteError', () => {
	it('응답을 못 받은 요청이면 연결 안내를 보여준다', () => {
		renderWithProviders(<RouteError error={new AxiosError('Network Error')} reset={() => {}} />);
		expect(screen.getByRole('heading', { name: '인터넷 연결이 없어요' })).toBeInTheDocument();
		expect(screen.getByRole('button', { name: '다시 시도' })).toBeInTheDocument();
	});

	it('그 밖의 오류는 일반 안내', () => {
		renderWithProviders(<RouteError error={new Error('boom')} reset={() => {}} />);
		expect(screen.getByRole('heading', { name: '화면을 불러오지 못했어요' })).toBeInTheDocument();
	});
});

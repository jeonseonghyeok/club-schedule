import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LogoutButton } from '@/components/Auth/organisms/LogoutButton';
import { deleteAuthSession } from '@/modules/api/auth/auth';
import { renderWithProviders } from '@/test/render';

vi.mock('@/modules/api/auth/auth', () => ({ deleteAuthSession: vi.fn() }));
const navigate = vi.fn();
vi.mock('@tanstack/react-router', async importOriginal => ({
	...(await importOriginal<typeof import('@tanstack/react-router')>()),
	useNavigate: () => navigate,
}));

describe('LogoutButton', () => {
	it('로그아웃하면 캐시를 비우고 메인으로 간다', async () => {
		vi.mocked(deleteAuthSession).mockResolvedValue(undefined);
		const { queryClient } = renderWithProviders(<LogoutButton />);
		queryClient.setQueryData(['auth', 'me'], { userKey: 1 });

		await userEvent.click(screen.getByRole('button', { name: '로그아웃' }));

		await waitFor(() => expect(navigate).toHaveBeenCalledWith({ to: '/', search: {} }));
		expect(queryClient.getQueryData(['auth', 'me'])).toBeUndefined();
	});
});

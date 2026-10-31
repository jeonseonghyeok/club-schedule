import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LogoutButton } from '@/components/Auth/organisms/LogoutButton';
import { resetToRoot } from '@/hooks/useAppBackNavigation';
import { deleteAuthSession } from '@/modules/api/auth/auth';
import { renderWithProviders } from '@/test/render';

vi.mock('@/modules/api/auth/auth', () => ({ deleteAuthSession: vi.fn() }));
vi.mock('@/hooks/useAppBackNavigation', () => ({ resetToRoot: vi.fn() }));
const history = {};
vi.mock('@tanstack/react-router', async importOriginal => ({
	...(await importOriginal<typeof import('@tanstack/react-router')>()),
	useRouter: () => ({ history }),
}));

describe('LogoutButton', () => {
	it('로그아웃하면 캐시를 비우고 지금 앱의 시작 화면으로 기록을 되돌린다', async () => {
		vi.mocked(deleteAuthSession).mockResolvedValue(undefined);
		const { queryClient } = renderWithProviders(<LogoutButton />);
		queryClient.setQueryData(['auth', 'me'], { userKey: 1 });

		await userEvent.click(screen.getByRole('button', { name: '로그아웃' }));

		await waitFor(() => expect(resetToRoot).toHaveBeenCalledWith(history));
		expect(queryClient.getQueryData(['auth', 'me'])).toBeUndefined();
	});
});

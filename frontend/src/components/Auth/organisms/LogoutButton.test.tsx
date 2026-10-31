import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LogoutButton } from '@/components/Auth/organisms/LogoutButton';
import { deleteAuthSession } from '@/modules/api/auth/auth';
import { renderWithProviders } from '@/test/render';
import { navigateWithReload } from '@/utils/navigation';

vi.mock('@/modules/api/auth/auth', () => ({ deleteAuthSession: vi.fn() }));
vi.mock('@/utils/navigation', () => ({ navigateWithReload: vi.fn() }));

describe('LogoutButton', () => {
	it('로그아웃하면 캐시를 비우고 보던 화면(모임 전용 앱이면 그 앱)을 다시 연다', async () => {
		window.history.replaceState(null, '', '/g/4/?tab=me');
		vi.mocked(deleteAuthSession).mockResolvedValue(undefined);
		const { queryClient } = renderWithProviders(<LogoutButton />);
		queryClient.setQueryData(['auth', 'me'], { userKey: 1 });

		await userEvent.click(screen.getByRole('button', { name: '로그아웃' }));

		await waitFor(() => expect(navigateWithReload).toHaveBeenCalledWith('/g/4/?tab=me'));
		expect(queryClient.getQueryData(['auth', 'me'])).toBeUndefined();
	});
});

import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { InstallBanner } from '@/components/GroupApp/organisms/InstallBanner';
import { usePwaStore } from '@/modules/stores/client/pwa';
import { renderWithProviders } from '@/test/render';

const fakePrompt = (): BeforeInstallPromptEvent => {
	const event = new Event('beforeinstallprompt');
	return Object.assign(event, {
		platforms: ['web'],
		prompt: vi.fn().mockResolvedValue(undefined),
		userChoice: Promise.resolve({ outcome: 'accepted' as const, platform: 'web' }),
	});
};

describe('InstallBanner', () => {
	afterEach(() => {
		act(() => usePwaStore.getState().actions.setInstallPrompt(null));
		localStorage.clear();
	});

	it('설치 제안이 없고 iOS 도 아니면 보이지 않는다', () => {
		renderWithProviders(<InstallBanner groupId={4} appName="독서 모임" themeColor="#1b5a46" />);
		expect(screen.queryByRole('complementary', { name: '앱 설치 안내' })).not.toBeInTheDocument();
	});

	it('설치 제안이 있으면 설치 창을 띄우고, 닫으면 이 모임에서는 다시 안 보인다', async () => {
		const prompt = fakePrompt();
		act(() => usePwaStore.getState().actions.setInstallPrompt(prompt));
		const { unmount } = renderWithProviders(<InstallBanner groupId={4} appName="독서 모임" themeColor="#1b5a46" />);

		await userEvent.click(screen.getByRole('button', { name: '설치' }));
		expect(prompt.prompt).toHaveBeenCalledOnce();

		act(() => usePwaStore.getState().actions.setInstallPrompt(fakePrompt()));
		await userEvent.click(screen.getByRole('button', { name: '설치 안내 닫기' }));
		expect(screen.queryByRole('complementary', { name: '앱 설치 안내' })).not.toBeInTheDocument();
		unmount();
		renderWithProviders(<InstallBanner groupId={4} appName="독서 모임" themeColor="#1b5a46" />);
		expect(screen.queryByRole('complementary', { name: '앱 설치 안내' })).not.toBeInTheDocument();
	});
});

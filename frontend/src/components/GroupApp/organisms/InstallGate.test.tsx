import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { InstallGate } from '@/components/GroupApp/organisms/InstallGate';
import { usePwaStore } from '@/modules/stores/client/pwa';
import { renderWithProviders } from '@/test/render';
import { buildKakaoTalkExternalUrl, detectInAppBrowser } from '@/utils/inAppBrowser';

vi.mock('@tanstack/react-router', async importOriginal => ({
	...(await importOriginal<typeof import('@tanstack/react-router')>()),
	Link: (props: { children: React.ReactNode }) => <a href="/groups/4">{props.children}</a>,
}));

const fakePrompt = (): BeforeInstallPromptEvent =>
	Object.assign(new Event('beforeinstallprompt'), {
		platforms: ['web'],
		prompt: vi.fn().mockResolvedValue(undefined),
		userChoice: Promise.resolve({ outcome: 'accepted' as const, platform: 'web' }),
	});

const setUserAgent = (value: string) => vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue(value);

const renderGate = () => renderWithProviders(<InstallGate groupId={4} appName="독서 모임" themeColor="#1b5a46" />);

describe('InstallGate', () => {
	afterEach(() => {
		act(() => usePwaStore.getState().actions.setInstallPrompt(null));
		vi.restoreAllMocks();
	});

	it('설치 창을 띄울 수 있으면 설치 버튼을 보여주고, 설치되면 앱으로 열라고 안내한다', async () => {
		const prompt = fakePrompt();
		act(() => usePwaStore.getState().actions.setInstallPrompt(prompt));
		renderGate();

		await userEvent.click(screen.getByRole('button', { name: '앱 설치' }));
		expect(prompt.prompt).toHaveBeenCalledOnce();

		act(() => void window.dispatchEvent(new Event('appinstalled')));
		expect(screen.getByText(/홈 화면의 독서 모임 앱을 눌러 여세요/)).toBeInTheDocument();
	});

	it('iOS 는 홈 화면에 추가하는 방법을 보여준다', () => {
		setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Safari/604.1');
		renderGate();
		expect(screen.getByText(/홈 화면에 추가/)).toBeInTheDocument();
	});

	it('카카오톡 안에서는 기본 브라우저로 여는 링크를 준다', () => {
		setUserAgent('Mozilla/5.0 (Linux; Android 14) KAKAOTALK 10.8.0');
		renderGate();
		expect(screen.getByRole('link', { name: '브라우저로 열기' })).toHaveAttribute(
			'href',
			buildKakaoTalkExternalUrl(window.location.href),
		);
		expect(screen.queryByRole('button', { name: '앱 설치' })).not.toBeInTheDocument();
	});

	it('설치하지 않고 볼 수 있는 모요라 모임 화면 링크가 있다', () => {
		renderGate();
		expect(screen.getByRole('link', { name: '설치하지 않고 모요라에서 모임 보기' })).toBeInTheDocument();
	});
});

describe('detectInAppBrowser', () => {
	it('카카오톡·그 밖의 앱 안 웹 보기·일반 브라우저를 구분한다', () => {
		expect(detectInAppBrowser('Mozilla/5.0 (iPhone) KAKAOTALK 10.8.0')).toBe('kakaotalk');
		expect(detectInAppBrowser('Mozilla/5.0 (Linux; Android 14; wv) Instagram 300')).toBe('other');
		expect(detectInAppBrowser('Mozilla/5.0 (Linux; Android 14) Chrome/130 Mobile Safari/537.36')).toBeNull();
	});
});

import { buildKakaoAuthorizeUrl, getKakaoRedirectUri, getLoginReturnPath } from '@/utils/kakao';

describe('kakao', () => {
	it('redirect URI 는 현재 출처 + 등록된 콜백 경로다', () => {
		expect(getKakaoRedirectUri('https://dev.crewhub.store')).toBe(
			'https://dev.crewhub.store/login/kakao/login_callback',
		);
	});

	it('인가 URL 에 client_id 와 인코딩된 redirect_uri 를 담는다', () => {
		const url = new URL(
			buildKakaoAuthorizeUrl({ clientId: 'key123', redirectUri: 'https://a.test/login/kakao/login_callback' }),
		);
		expect(url.origin + url.pathname).toBe('https://kauth.kakao.com/oauth/authorize');
		expect(url.searchParams.get('response_type')).toBe('code');
		expect(url.searchParams.get('client_id')).toBe('key123');
		expect(url.searchParams.get('redirect_uri')).toBe('https://a.test/login/kakao/login_callback');
		expect(url.searchParams.has('state')).toBe(false);
	});

	it('복귀 경로를 state 로 싣는다', () => {
		const url = new URL(
			buildKakaoAuthorizeUrl({ clientId: 'k', redirectUri: 'https://a.test/cb', state: '/groups/4' }),
		);
		expect(url.searchParams.get('state')).toBe('/groups/4');
	});

	it('로그인 화면 자신으로는 돌아가지 않는다(인가 반복 방지)', () => {
		expect(getLoginReturnPath('/login/kakao/login_callback')).toBe('/');
		expect(getLoginReturnPath('/login/test')).toBe('/');
		expect(getLoginReturnPath('/groups/42?tab=schedule')).toBe('/groups/42?tab=schedule');
		expect(getLoginReturnPath('//evil.com')).toBe('/');
	});
});

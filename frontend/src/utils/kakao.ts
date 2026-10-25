const KAKAO_AUTHORIZE_URL = 'https://kauth.kakao.com/oauth/authorize';

/** 카카오 콘솔에 등록된 redirect URI 경로. 백엔드 KAKAO_REDIRECT_WHITELIST 와 같아야 한다. */
export const KAKAO_CALLBACK_PATH = '/login/kakao/login_callback';

/** 토큰 교환 때 인가 요청과 같은 값을 보내야 하므로 한 곳에서 만든다 */
export const getKakaoRedirectUri = (origin: string): string => `${origin}${KAKAO_CALLBACK_PATH}`;

/** state 는 카카오가 콜백에 그대로 돌려주는 값 — 로그인 후 복귀 경로를 싣는다 */
export const buildKakaoAuthorizeUrl = (params: { clientId: string; redirectUri: string; state?: string }): string => {
	const query = new URLSearchParams({
		response_type: 'code',
		client_id: params.clientId,
		redirect_uri: params.redirectUri,
	});
	if (params.state) query.set('state', params.state);
	return `${KAKAO_AUTHORIZE_URL}?${query.toString()}`;
};

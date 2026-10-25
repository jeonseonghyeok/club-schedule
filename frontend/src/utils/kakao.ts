const KAKAO_AUTHORIZE_URL = 'https://kauth.kakao.com/oauth/authorize';

import { getSafeReturnPath } from '@/utils/navigation';

/** 카카오 콘솔에 등록된 redirect URI 경로. 백엔드 KAKAO_REDIRECT_WHITELIST 와 같아야 한다. */
export const KAKAO_CALLBACK_PATH = '/login/kakao/login_callback';

const LOGIN_PATH_PREFIX = '/login/';
const DEFAULT_PATH = '/';

/**
 * 로그인 뒤 돌아갈 경로. 같은 출처 경로만 허용하고, 로그인 화면 자신(콜백 등)으로 돌아가면
 * 코드 없이 콜백이 다시 열려 카카오 인가를 반복하므로 메인으로 바꾼다(백엔드 LoginController 와 같은 방어).
 */
export const getLoginReturnPath = (returnTo: string | undefined): string => {
	const safe = getSafeReturnPath(returnTo);
	return safe.startsWith(LOGIN_PATH_PREFIX) ? DEFAULT_PATH : safe;
};

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

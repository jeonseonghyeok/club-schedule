const DEFAULT_RETURN_PATH = '/';

/**
 * 로그인 후 돌아갈 경로. 오픈 리다이렉트를 막기 위해 같은 출처의 절대 경로만 허용한다
 * ('//evil.com', 'https://…', '/\\evil.com' 같은 값은 기본 경로로 바꾼다).
 */
export const getSafeReturnPath = (returnTo: string | undefined): string => {
	if (!returnTo || !returnTo.startsWith('/') || returnTo.startsWith('//') || returnTo.startsWith('/\\')) {
		return DEFAULT_RETURN_PATH;
	}
	return returnTo;
};

/**
 * 아직 Thymeleaf 가 그리는 화면으로 이동한다. 해당 경로가 SPA 라우트가 아니므로
 * 클라이언트 라우팅이 아니라 전체 페이지 이동이어야 한다.
 * TODO: 이동 대상 화면이 React 로 옮겨지면 useNavigate 로 바꾼다.
 */
export const navigateToServerPage = (path: string): void => {
	window.location.assign(path);
};

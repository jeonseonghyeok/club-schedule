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
 * 문서 전체를 다시 불러오며 이동한다. 로그인·로그아웃 직후처럼 앱 상태(인증·쿼리 캐시)를
 * 처음부터 다시 시작해야 할 때 쓴다 — 평소 화면 이동은 라우터 Link·navigate 를 쓴다.
 * 지금 기록을 바꿔 쓴다(replace): 로그인 콜백·카카오 화면이 뒤로가기 기록에 남으면 뒤로가기가 로그인으로 되돌아간다.
 */
export const navigateWithReload = (path: string): void => {
	window.location.replace(path);
};

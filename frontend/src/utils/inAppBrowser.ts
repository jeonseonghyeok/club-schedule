/** 앱 안의 웹 보기(인앱 브라우저) — 여기서는 홈 화면 앱을 설치할 수 없다 */
export const IN_APP_BROWSER = { KAKAOTALK: 'kakaotalk', OTHER: 'other' } as const;
export type InAppBrowser = (typeof IN_APP_BROWSER)[keyof typeof IN_APP_BROWSER];

const KAKAOTALK_PATTERN = /KAKAOTALK/i;
// 네이버·인스타그램·페이스북·라인·다음·밴드 앱과 Android WebView(; wv))
const OTHER_IN_APP_PATTERN = /NAVER\(inapp|Instagram|FBAN|FBAV|Line\/|DaumApps|BAND\/|; wv\)/i;

export const detectInAppBrowser = (userAgent: string): InAppBrowser | null => {
	if (KAKAOTALK_PATTERN.test(userAgent)) return IN_APP_BROWSER.KAKAOTALK;
	if (OTHER_IN_APP_PATTERN.test(userAgent)) return IN_APP_BROWSER.OTHER;
	return null;
};

/** 카카오톡 인앱 브라우저에서 같은 주소를 기본 브라우저(Chrome·Safari)로 연다 */
export const buildKakaoTalkExternalUrl = (url: string): string =>
	`kakaotalk://web/openExternal?url=${encodeURIComponent(url)}`;

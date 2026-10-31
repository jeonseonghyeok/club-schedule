import { navigateWithReload } from '@/utils/navigation';

/**
 * 로그인은 카카오 화면을 거쳐 오므로, 끝나고 앞으로 이동하면 카카오·콜백 화면이 뒤로가기 기록에 남는다
 * (설치한 앱에서 뒤로가기를 누르면 카카오 화면이 다시 나온다). 그래서 로그인을 시작한 화면의 기록 위치를 기억해 두었다가
 * 로그인이 끝나면 그 기록으로 되돌아간다 — 그 위의 카카오 기록은 "앞으로" 쪽에 남아 뒤로가기에 걸리지 않는다.
 */
const LOGIN_START_KEY = 'moyora:login-start';
/** 되돌아간 화면이 브라우저 캐시(bfcache)에서 그대로 살아나면 로그인 상태를 반영하도록 다시 불러온다 */
const AUTH_RELOAD_KEY = 'moyora:auth-reload';
// 기록 이동이 안 되는 환경(새 창으로 열린 경우 등)에서는 잠시 뒤 앞으로 이동한다
const RETURN_FALLBACK_MS = 1500;

interface LoginStart {
	readonly position: number;
	readonly path: string;
}

const isLoginStart = (value: unknown): value is LoginStart =>
	typeof value === 'object' &&
	value !== null &&
	'position' in value &&
	typeof value.position === 'number' &&
	'path' in value &&
	typeof value.path === 'string';

const readLoginStart = (): LoginStart | null => {
	try {
		const raw = sessionStorage.getItem(LOGIN_START_KEY);
		sessionStorage.removeItem(LOGIN_START_KEY);
		const parsed: unknown = raw ? JSON.parse(raw) : null;
		return isLoginStart(parsed) ? parsed : null;
	} catch {
		return null;
	}
};

/** 콜백 화면이 카카오로 떠나기 직전에 부른다 — 로그인 버튼을 누른 화면은 바로 아래 기록이다 */
export const rememberLoginStart = (returnPath: string): void => {
	try {
		const start: LoginStart = { position: window.history.length - 2, path: returnPath };
		sessionStorage.setItem(LOGIN_START_KEY, JSON.stringify(start));
	} catch {
		// 저장소를 못 쓰면 앞으로 이동한다
	}
};

/** 로그인이 끝나면 시작한 화면의 기록으로 돌아간다. 기억한 위치가 없거나 다른 화면이면 앞으로 이동한다 */
export const returnToLoginStart = (returnPath: string): void => {
	const start = readLoginStart();
	const steps = start ? window.history.length - 1 - start.position : 0;
	if (!start || start.path !== returnPath || steps <= 0) {
		navigateWithReload(returnPath);
		return;
	}
	try {
		sessionStorage.setItem(AUTH_RELOAD_KEY, '1');
	} catch {
		// bfcache 로 살아나면 비회원 화면이 잠깐 보일 수 있다
	}
	window.setTimeout(() => navigateWithReload(returnPath), RETURN_FALLBACK_MS);
	window.history.go(-steps);
};

/** 앱 시작 때 부른다 — bfcache 로 되살아난 화면은 로그인 상태를 반영하도록 다시 불러온다 */
export const startAuthReloadOnRestore = (): void => {
	try {
		sessionStorage.removeItem(AUTH_RELOAD_KEY);
	} catch {
		return;
	}
	window.addEventListener('pageshow', event => {
		if (!event.persisted || sessionStorage.getItem(AUTH_RELOAD_KEY) !== '1') return;
		sessionStorage.removeItem(AUTH_RELOAD_KEY);
		window.location.reload();
	});
};

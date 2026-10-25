import { AxiosError } from 'axios';
import type { AxiosInstance } from 'axios';

/** 백엔드 GlobalExceptionHandler · JwtAuthenticationFilter 의 공통 에러 바디 */
export interface ServerError {
	readonly error: string;
	readonly message: string;
}

const REQUEST_TIMEOUT_MS = 15_000;

/** 서버가 읽을 수 있는 메시지를 주지 않았을 때의 에러 코드 — 화면은 상황별 문구로 대체한다 */
export const UNKNOWN_ERROR_CODE = 'Unknown';

const UNKNOWN_SERVER_ERROR: ServerError = {
	error: UNKNOWN_ERROR_CODE,
	message: '일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
};

export const isServerError = (data: unknown): data is ServerError =>
	typeof data === 'object' &&
	data !== null &&
	'error' in data &&
	typeof data.error === 'string' &&
	'message' in data &&
	typeof data.message === 'string';

const hasMessage = (data: unknown): data is { message: string } =>
	typeof data === 'object' && data !== null && 'message' in data && typeof data.message === 'string';

// 프록시 502·네트워크 오류나 {message} 만 내려주는 일부 API 처럼 바디가 ServerError 형태가 아닐 때도
// 호출부가 error.response.data 를 ServerError 로 다룰 수 있게 맞춘다.
const toServerError = (data: unknown): ServerError => {
	if (isServerError(data)) return data;
	if (hasMessage(data)) return { error: 'Error', message: data.message };
	return UNKNOWN_SERVER_ERROR;
};

const normalizeError = (error: unknown): Promise<never> => {
	if (error instanceof AxiosError && error.response) {
		error.response.data = toServerError(error.response.data);
	}
	return Promise.reject(error);
};

export const setupInterceptors = (instance: AxiosInstance): void => {
	instance.defaults.timeout = REQUEST_TIMEOUT_MS;
	// 인증은 같은 출처의 httpOnly AUTH_TOKEN 쿠키로 자동 전송된다.
	instance.defaults.headers.common.Accept = 'application/json';
	instance.interceptors.response.use(response => response, normalizeError);
};

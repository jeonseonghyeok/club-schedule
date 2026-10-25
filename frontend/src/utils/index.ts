import { clsx } from 'clsx';
import type { ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { UNKNOWN_ERROR_CODE } from '@/modules/api/setupInterceptors';
import type { ServerError } from '@/modules/api/setupInterceptors';

const DEFAULT_ERROR_MESSAGE = '요청을 처리하지 못했습니다. 잠시 후 다시 시도해주세요.';

/**
 * 서버 에러 바디의 message 는 사용자에게 보여줄 문장으로 내려온다.
 * 서버가 메시지를 주지 않았으면(UNKNOWN) 호출부의 상황별 문구(fallback)를 쓴다.
 */
export const getErrorMessage = (serverError: ServerError | undefined, fallback = DEFAULT_ERROR_MESSAGE): string => {
	if (!serverError || serverError.error === UNKNOWN_ERROR_CODE) return fallback;
	return serverError.message.trim() || fallback;
};

export const cn = (...inputs: ClassValue[]): string => twMerge(clsx(inputs));

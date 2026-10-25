import { clsx } from 'clsx';
import type { ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { ServerError } from '@/modules/api/setupInterceptors';

const DEFAULT_ERROR_MESSAGE = '요청을 처리하지 못했습니다. 잠시 후 다시 시도해주세요.';

/** 서버 에러 바디의 message 는 사용자에게 보여줄 문장으로 내려온다 */
export const getErrorMessage = (serverError: ServerError | undefined): string =>
	serverError?.message.trim() || DEFAULT_ERROR_MESSAGE;

export const cn = (...inputs: ClassValue[]): string => twMerge(clsx(inputs));

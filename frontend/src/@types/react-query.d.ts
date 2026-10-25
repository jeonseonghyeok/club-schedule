import '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { ServerError } from '@/modules/api/setupInterceptors';

// 모든 API 가 axios + setupInterceptors 를 거치므로 쿼리·뮤테이션 에러는 항상 AxiosError<ServerError> 다.
declare module '@tanstack/react-query' {
	interface Register {
		defaultError: AxiosError<ServerError>;
	}
}

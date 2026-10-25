import type { KakaoLoginRequest, TestAccount, TestLoginResult } from '@/types/Auth';
import { authApi } from '.';

// 성공 시 백엔드가 httpOnly AUTH_TOKEN 쿠키를 Set-Cookie 로 내려준다.
export const createKakaoLogin = async (request: KakaoLoginRequest): Promise<void> => {
	await authApi.post('/api/login/kakao', request);
};

export const getTestAccounts = async (): Promise<TestAccount[]> => {
	const { data } = await authApi.get<TestAccount[]>('/api/login/test/accounts');
	return data;
};

export const createTestLogin = async (kakaoApiId: number): Promise<TestLoginResult> => {
	const { data } = await authApi.post<TestLoginResult>('/api/login/test', { kakaoApiId });
	return data;
};

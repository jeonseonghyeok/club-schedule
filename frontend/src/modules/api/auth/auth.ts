import type { AuthMe } from '@/types/Auth';
import { authApi } from '.';

export const getMe = async (): Promise<AuthMe> => {
	const { data } = await authApi.get<AuthMe>('/api/auth/me');
	return data;
};

/** 로그아웃 — httpOnly 쿠키라 서버가 지운다(만료된 토큰이어도 호출 가능) */
export const deleteAuthSession = async (): Promise<void> => {
	await authApi.post('/api/auth/logout');
};

import { HttpStatusCode } from 'axios';
import type { AuthMe } from '@/types/Auth';
import { authApi } from '.';

/** 로그인 사용자 — 비회원은 서버가 204(본문 없음)를 주므로 null */
export const getMe = async (): Promise<AuthMe | null> => {
	const { data, status } = await authApi.get<AuthMe | ''>('/api/auth/me');
	return status === HttpStatusCode.NoContent || !data ? null : data;
};

/** 로그아웃 — httpOnly 쿠키라 서버가 지운다(만료된 토큰이어도 호출 가능) */
export const deleteAuthSession = async (): Promise<void> => {
	await authApi.post('/api/auth/logout');
};

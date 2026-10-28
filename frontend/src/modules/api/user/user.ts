import type { AccountNickname } from '@/types/Auth';
import { userApi } from '.';

/** 계정 닉네임(1~30자) — 모임 닉네임이 없는 모임에서는 이 이름이 보인다 */
export const updateAccountNickname = async (nickname: string): Promise<AccountNickname> => {
	const { data } = await userApi.patch<AccountNickname>('/api/users/me', { nickname });
	return data;
};

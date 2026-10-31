import type { AccountNickname, AccountNicknameRequest } from '@/types/Auth';
import type { NicknameHistory } from '@/types/Nickname';
import { userApi } from '.';

/** 계정 닉네임(1~30자) — 모임 닉네임은 모임마다 따로라, 같이 바꿀 모임을 groupIds 로 고른다 */
export const updateAccountNickname = async (request: AccountNicknameRequest): Promise<AccountNickname> => {
	const { data } = await userApi.patch<AccountNickname>('/api/users/me', request);
	return data;
};

/** 내 계정·모든 모임 닉네임 변경 이력(최신순) */
export const getMyNicknameHistory = async (): Promise<NicknameHistory[]> => {
	const { data } = await userApi.get<NicknameHistory[]>('/api/users/me/nickname-history');
	return data;
};

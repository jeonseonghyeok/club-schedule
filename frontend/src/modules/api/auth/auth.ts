import type { AuthMe } from '@/types/Auth';
import { authApi } from '.';

export const getMe = async (): Promise<AuthMe> => {
	const { data } = await authApi.get<AuthMe>('/api/auth/me');
	return data;
};

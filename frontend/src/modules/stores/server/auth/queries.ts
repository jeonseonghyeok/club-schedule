import { queryOptions } from '@tanstack/react-query';
import { AxiosError, HttpStatusCode } from 'axios';
import { getMe } from '@/modules/api/auth/auth';
import { getTestAccounts } from '@/modules/api/auth/login';
import type { AuthMe } from '@/types/Auth';

// 비로그인(401)은 에러가 아니라 "로그인 안 됨" 상태로 다룬다.
const getMeOrNull = async (): Promise<AuthMe | null> => {
	try {
		return await getMe();
	} catch (error) {
		if (error instanceof AxiosError && error.response?.status === HttpStatusCode.Unauthorized) return null;
		throw error;
	}
};

export const authQueries = {
	all: () => ['auth'],
	me: () =>
		queryOptions({
			queryKey: [...authQueries.all(), 'me'],
			queryFn: getMeOrNull,
			retry: false,
		}),
	testAccounts: () =>
		queryOptions({
			queryKey: [...authQueries.all(), 'testAccounts'],
			queryFn: getTestAccounts,
			retry: false,
		}),
};

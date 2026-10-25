import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ModalType } from '@/constants';
import { createKakaoLogin, createTestLogin } from '@/modules/api/auth/login';
import { useModalStore } from '@/modules/stores/client/modal';
import { getErrorMessage } from '@/utils';
import { authQueries } from './queries';

// 로그인 응답에는 /api/auth/me 의 전체 정보(roles 등)가 없어 캐시를 직접 채울 수 없다.
// 다른 사용자의 이전 인증 정보가 남지 않도록 비우고, 다음 조회 때 새로 가져오게 한다.
const AUTH_QUERY_FILTER = { queryKey: authQueries.all() };

export const useCreateTestLogin = () => {
	const openModal = useModalStore(state => state.actions.openModal);
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: createTestLogin,
		onSuccess: () => queryClient.removeQueries(AUTH_QUERY_FILTER),
		onError: error => {
			openModal({ type: ModalType.ALERT, message: getErrorMessage(error.response?.data) });
		},
	});
};

/** 콜백 화면이 실패 상태를 직접 보여주므로 모달을 띄우지 않는다 */
export const useCreateKakaoLogin = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: createKakaoLogin,
		onSuccess: () => queryClient.removeQueries(AUTH_QUERY_FILTER),
	});
};

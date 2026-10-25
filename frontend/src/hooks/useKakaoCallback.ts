import { useEffect, useRef } from 'react';
import { useCreateKakaoLogin } from '@/modules/stores/server/auth/mutations';
import { getErrorMessage } from '@/utils';
import { buildKakaoAuthorizeUrl, getKakaoRedirectUri } from '@/utils/kakao';
import { getSafeReturnPath, navigateWithReload } from '@/utils/navigation';

export interface KakaoCallbackParams {
	/** 카카오가 돌려준 인가 코드 — 없으면 인가 요청부터 시작한다 */
	code?: string;
	/** 사용자가 동의를 취소하면 카카오가 access_denied 등을 돌려준다 */
	error?: string;
	/** 인가 요청 때 실어 보낸 복귀 경로(카카오가 그대로 돌려준다) */
	state?: string;
	/** 인가 요청 전, 로그인 버튼이 넘긴 복귀 경로 */
	returnTo?: string;
}

export type KakaoCallbackState =
	| { status: 'redirecting' }
	| { status: 'processing' }
	| { status: 'success' }
	| { status: 'cancelled' }
	| { status: 'error'; message: string };

export const useKakaoCallback = (params: KakaoCallbackParams): KakaoCallbackState => {
	const { code, error, state, returnTo } = params;
	const { mutate, status, error: mutationError } = useCreateKakaoLogin();
	// 인가 코드는 한 번만 쓸 수 있다 — StrictMode 의 이펙트 이중 실행에도 한 번만 교환한다.
	const hasStartedRef = useRef(false);

	useEffect(() => {
		if (hasStartedRef.current || error) return;
		hasStartedRef.current = true;

		const redirectUri = getKakaoRedirectUri(window.location.origin);
		if (!code) {
			window.location.replace(
				buildKakaoAuthorizeUrl({
					clientId: import.meta.env.VITE_KAKAO_REST_KEY,
					redirectUri,
					state: getSafeReturnPath(returnTo),
				}),
			);
			return;
		}

		const returnPath = getSafeReturnPath(state);
		mutate({ code, redirectUri, returnTo: returnPath }, { onSuccess: () => navigateWithReload(returnPath) });
	}, [code, error, state, returnTo, mutate]);

	if (error) return { status: 'cancelled' };
	if (!code) return { status: 'redirecting' };
	if (status === 'success') return { status: 'success' };
	if (status === 'error') return { status: 'error', message: getErrorMessage(mutationError?.response?.data) };
	return { status: 'processing' };
};

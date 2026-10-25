import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';
import { StatusMessage } from '@/components/common/molecules/StatusMessage';
import type { StatusTone } from '@/components/common/molecules/StatusMessage';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { useKakaoCallback } from '@/hooks/useKakaoCallback';
import type { KakaoCallbackState } from '@/hooks/useKakaoCallback';

const kakaoCallbackSearchSchema = z.object({
	code: z.string().optional(),
	error: z.string().optional(),
	state: z.string().optional(),
	returnTo: z.string().optional(),
});

interface StatusView {
	tone: StatusTone;
	message: string;
}

const toStatusView = (state: KakaoCallbackState): StatusView => {
	switch (state.status) {
		case 'redirecting':
			return { tone: 'pending', message: '카카오 로그인으로 이동합니다…' };
		case 'processing':
			return { tone: 'pending', message: '로그인 처리 중입니다…' };
		case 'success':
			return { tone: 'success', message: '로그인되었습니다. 잠시 후 이동합니다.' };
		case 'cancelled':
			return { tone: 'error', message: '카카오 로그인이 취소되었습니다.' };
		case 'error':
			return { tone: 'error', message: state.message };
		default: {
			const exhaustive: never = state;
			return exhaustive;
		}
	}
};

const KakaoCallbackPage = () => {
	const search = Route.useSearch();
	const state = useKakaoCallback(search);
	const view = toStatusView(state);
	const canRetry = state.status === 'cancelled' || state.status === 'error';

	return (
		<AuthLayout title="카카오 로그인">
			<StatusMessage tone={view.tone} message={view.message} />
			{canRetry && (
				<div className="mt-6 flex gap-2">
					{/* 인가 코드 없이 다시 열면 인가 요청부터 다시 시작한다 */}
					<a
						href="/login/kakao/login_callback"
						className="rounded-md bg-yellow-300 px-4 py-2 text-sm font-medium text-gray-900 focus-visible:outline-2 focus-visible:outline-gray-900"
					>
						다시 시도
					</a>
					<a
						href="/"
						className="rounded-md px-4 py-2 text-sm text-gray-700 ring-1 ring-gray-300 focus-visible:outline-2 focus-visible:outline-gray-900"
					>
						메인으로
					</a>
				</div>
			)}
		</AuthLayout>
	);
};

export const Route = createFileRoute('/login/kakao/login_callback')({
	validateSearch: kakaoCallbackSearchSchema,
	component: KakaoCallbackPage,
});

import { useRouter } from '@tanstack/react-router';
import type { ErrorComponentProps } from '@tanstack/react-router';
import { AxiosError } from 'axios';
import { Button } from '@/components/common/atoms/Button';
import { useGoHome } from '@/hooks/useAppBackNavigation';

/** 응답을 받지 못한 요청(오프라인·서버 연결 실패)인지 */
const isNetworkError = (error: unknown): boolean =>
	!navigator.onLine || (error instanceof AxiosError && error.response === undefined);

/** 화면을 그리지 못했을 때(라우터 기본 오류 화면 대신) — 다시 시도·홈으로 */
export const RouteError = (props: ErrorComponentProps) => {
	const router = useRouter();
	const goHome = useGoHome();
	const isOffline = isNetworkError(props.error);

	return (
		<main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
			<h1 className="text-xl font-bold text-gray-900">
				{isOffline ? '인터넷 연결이 없어요' : '화면을 불러오지 못했어요'}
			</h1>
			<p className="text-sm text-gray-600">
				{isOffline
					? '처음 여는 화면은 연결된 뒤에 볼 수 있어요. 연결을 확인하고 다시 시도해 주세요.'
					: '잠시 후 다시 시도해 주세요. 계속되면 홈에서 다시 들어와 주세요.'}
			</p>
			<div className="flex gap-2">
				<Button
					onClick={() => {
						props.reset();
						void router.invalidate();
					}}
				>
					다시 시도
				</Button>
				<Button variant="secondary" onClick={goHome}>
					홈으로
				</Button>
			</div>
		</main>
	);
};

/** 없는 주소 */
export const RouteNotFound = () => {
	const goHome = useGoHome();
	return (
		<main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
			<h1 className="text-xl font-bold text-gray-900">페이지를 찾을 수 없어요</h1>
			<p className="text-sm text-gray-600">주소가 바뀌었거나 없어진 화면이에요.</p>
			<Button onClick={goHome}>홈으로</Button>
		</main>
	);
};

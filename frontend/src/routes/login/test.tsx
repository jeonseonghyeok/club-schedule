import { useQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { TestLoginForm } from '@/components/Auth/organisms/TestLoginForm';
import { StatusMessage } from '@/components/common/molecules/StatusMessage';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { useCreateTestLogin } from '@/modules/stores/server/auth/mutations';
import { authQueries } from '@/modules/stores/server/auth/queries';
import { getErrorMessage } from '@/utils';
import { navigateToServerPage } from '@/utils/navigation';

const HOME_PATH = '/';

// 테스트 인증이 꺼진 환경(운영)에서는 계정 목록 API 가 503 을 준다 — useQuery 로 받아 화면에 안내한다.
const TestLoginPage = () => {
	const { data: accounts, error, isPending } = useQuery({ ...authQueries.testAccounts() });
	const { mutate: login, isPending: isLoggingIn, data: loggedIn } = useCreateTestLogin();

	const handleSubmit = (kakaoApiId: number) => login(kakaoApiId, { onSuccess: () => navigateToServerPage(HOME_PATH) });

	const renderContent = () => {
		if (isPending) return <StatusMessage tone="pending" message="계정 목록을 불러오는 중입니다…" />;
		if (error) return <StatusMessage tone="error" message={getErrorMessage(error.response?.data)} />;
		if (loggedIn) {
			return (
				<StatusMessage tone="success" message={`${loggedIn.nickname}(${loggedIn.userKey}) 로그인 완료. 이동 중…`} />
			);
		}
		return <TestLoginForm accounts={accounts} isSubmitting={isLoggingIn} onSubmit={handleSubmit} />;
	};

	return (
		<AuthLayout title="테스트 로그인" description="개발 환경 전용. 운영 서버에서는 동작하지 않습니다.">
			{renderContent()}
		</AuthLayout>
	);
};

export const Route = createFileRoute('/login/test')({
	component: TestLoginPage,
});

import { useSuspenseQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { authQueries } from '@/modules/stores/server/auth/queries';

// TODO: 4단계에서 기존 main.html 화면으로 교체한다. 지금은 앱 뼈대·인증 연동 확인용.
const HomePage = () => {
	const { data: me } = useSuspenseQuery({ ...authQueries.me() });

	return (
		<main className="mx-auto max-w-xl px-4 py-12">
			<h1 className="text-2xl font-bold text-gray-900">모요라</h1>
			<p className="mt-4 text-gray-700">
				{me ? `로그인됨 (userKey ${me.userKey}${me.isAdmin ? ', 관리자' : ''})` : '로그인되지 않았습니다.'}
			</p>
		</main>
	);
};

export const Route = createFileRoute('/')({
	loader: ({ context }) => context.queryClient.ensureQueryData(authQueries.me()),
	component: HomePage,
});

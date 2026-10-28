import { useSuspenseQuery } from '@tanstack/react-query';
import { createFileRoute, Link } from '@tanstack/react-router';
import { z } from 'zod';
import { GroupJoinsPanel } from '@/components/Admin/organisms/GroupJoinsPanel';
import { GroupRequestsPanel } from '@/components/Admin/organisms/GroupRequestsPanel';
import { GroupsPanel } from '@/components/Admin/organisms/GroupsPanel';
import { UsersPanel } from '@/components/Admin/organisms/UsersPanel';
import { Icon } from '@/components/common/atoms/Icon';
import { Tabs } from '@/components/common/organisms/Tabs';
import type { TabItem } from '@/components/common/organisms/Tabs';
import { AppShell, APP_SHELL_WIDTH } from '@/components/layout/AppShell';
import { authQueries } from '@/modules/stores/server/auth/queries';

const ADMIN_TAB_KEYS = ['users', 'groups', 'groupRequests', 'groupJoins'] as const;
type AdminTabKey = (typeof ADMIN_TAB_KEYS)[number];

const TABS: readonly TabItem<AdminTabKey>[] = [
	{ key: 'users', label: '회원', render: () => <UsersPanel /> },
	{ key: 'groups', label: '그룹', render: () => <GroupsPanel /> },
	{ key: 'groupRequests', label: '그룹 신청', render: () => <GroupRequestsPanel /> },
	{ key: 'groupJoins', label: '가입 요청 모니터링', render: () => <GroupJoinsPanel /> },
];

// 선택한 탭을 주소에 남겨 새로고침·뒤로가기에도 유지한다
const adminSearchSchema = z.object({
	tab: z.enum(ADMIN_TAB_KEYS).catch('users'),
});

const AdminPage = () => {
	const { data: me } = useSuspenseQuery({ ...authQueries.me() });
	const { tab } = Route.useSearch();
	const navigate = Route.useNavigate();

	return (
		<AppShell
			title="관리자 대시보드"
			isLoggedIn={!!me}
			width={APP_SHELL_WIDTH.WIDE}
			leading={
				<Link
					to="/settings"
					aria-label="설정으로"
					className="-ml-2 flex size-10 items-center justify-center rounded-full text-gray-600 hover:bg-gray-100 focus-visible:outline-2 focus-visible:outline-brand-600"
				>
					<Icon name="chevronLeft" />
				</Link>
			}
		>
			{me?.isAdmin ? (
				<Tabs label="관리자 메뉴" tabs={TABS} selected={tab} onSelect={key => navigate({ search: { tab: key } })} />
			) : (
				<p role="alert" className="rounded-2xl bg-white p-6 text-gray-700 ring-1 ring-gray-200">
					{me ? '관리자 권한이 없습니다.' : '로그인이 필요합니다.'}
				</p>
			)}
		</AppShell>
	);
};

export const Route = createFileRoute('/admin')({
	validateSearch: adminSearchSchema,
	loader: ({ context }) => context.queryClient.ensureQueryData(authQueries.me()),
	component: AdminPage,
});

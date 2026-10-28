import { useQuery, useSuspenseQuery } from '@tanstack/react-query';
import { createFileRoute, Link, redirect } from '@tanstack/react-router';
import { LogoutButton } from '@/components/Auth/organisms/LogoutButton';
import { Icon } from '@/components/common/atoms/Icon';
import { SectionCard } from '@/components/common/molecules/SectionCard';
import { AppShell } from '@/components/layout/AppShell';
import { AccountNicknameForm } from '@/components/Settings/organisms/AccountNicknameForm';
import { AppInstallSection } from '@/components/Settings/organisms/AppInstallSection';
import { FavoriteGroupField } from '@/components/Settings/organisms/FavoriteGroupField';
import { GroupNicknameList } from '@/components/Settings/organisms/GroupNicknameList';
import { authQueries } from '@/modules/stores/server/auth/queries';
import { groupQueries } from '@/modules/stores/server/group/queries';

const SettingsPage = () => {
	const { data: me } = useSuspenseQuery({ ...authQueries.me() });
	const { data: groups, isError } = useQuery({ ...groupQueries.myGroups() });
	// beforeLoad 가 비로그인을 돌려보내므로 여기서는 항상 로그인 상태다
	if (!me) return null;

	return (
		<AppShell title="설정" isLoggedIn>
			<SectionCard title="프로필">
				<AccountNicknameForm nickname={me.nickname} />
			</SectionCard>
			<SectionCard title="모임 닉네임">
				<GroupNicknameList groups={groups} isError={isError} userKey={me.userKey} accountNickname={me.nickname} />
			</SectionCard>
			<SectionCard title="모임">
				<FavoriteGroupField groups={groups ?? []} favoriteGroupId={me.favoriteGroupId} />
			</SectionCard>
			<SectionCard title="앱">
				<AppInstallSection />
			</SectionCard>
			{me.isAdmin && (
				<Link
					to="/admin"
					search={{ tab: 'users' }}
					className="flex items-center justify-between rounded-2xl bg-white px-4 py-4 text-[15px] font-semibold text-gray-900 ring-1 ring-gray-200 hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-brand-600"
				>
					관리자 대시보드
					<Icon name="chevronRight" className="text-gray-400" />
				</Link>
			)}
			<div className="flex flex-col items-stretch gap-2 pt-2">
				<LogoutButton />
				<p className="text-center text-xs text-gray-400">{me.nickname} 계정으로 로그인됨</p>
			</div>
		</AppShell>
	);
};

export const Route = createFileRoute('/settings')({
	beforeLoad: async ({ context, location }) => {
		const me = await context.queryClient.ensureQueryData(authQueries.me());
		if (!me) throw redirect({ to: '/', search: { returnTo: location.href } });
	},
	component: SettingsPage,
});

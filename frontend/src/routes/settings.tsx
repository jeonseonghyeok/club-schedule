import { useQuery, useSuspenseQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
import { LoginCard } from '@/components/Auth/organisms/LoginCard';
import { LogoutButton } from '@/components/Auth/organisms/LogoutButton';
import { Button } from '@/components/common/atoms/Button';
import { Icon } from '@/components/common/atoms/Icon';
import { SectionCard } from '@/components/common/molecules/SectionCard';
import { AppShell } from '@/components/layout/AppShell';
import { AccountNicknameForm } from '@/components/Settings/organisms/AccountNicknameForm';
import { AppInstallSection } from '@/components/Settings/organisms/AppInstallSection';
import { FavoriteGroupField } from '@/components/Settings/organisms/FavoriteGroupField';
import { GroupNicknameList } from '@/components/Settings/organisms/GroupNicknameList';
import { NicknameHistoryDialog } from '@/components/Settings/organisms/NicknameHistoryDialog';
import { authQueries } from '@/modules/stores/server/auth/queries';
import { groupQueries } from '@/modules/stores/server/group/queries';

const SettingsPage = () => {
	const { data: me } = useSuspenseQuery({ ...authQueries.me() });
	const { data: groups, isError } = useQuery({ ...groupQueries.myGroups(), enabled: !!me });
	const [isHistoryOpen, setIsHistoryOpen] = useState(false);
	if (!me) {
		return (
			<AppShell title="설정" isLoggedIn={false}>
				<LoginCard title="로그인" message="로그인하면 닉네임·우선모임을 정하고 알림을 받을 수 있어요." />
				<SectionCard title="앱">
					<AppInstallSection />
				</SectionCard>
			</AppShell>
		);
	}

	return (
		<AppShell title="설정" isLoggedIn>
			<SectionCard title="프로필">
				<AccountNicknameForm nickname={me.nickname} groups={groups ?? []} />
			</SectionCard>
			<SectionCard
				title="모임 닉네임"
				actions={
					<Button variant="secondary" onClick={() => setIsHistoryOpen(true)}>
						변경 이력
					</Button>
				}
			>
				<GroupNicknameList groups={groups} isError={isError} accountNickname={me.nickname} />
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
			{isHistoryOpen && <NicknameHistoryDialog onClose={() => setIsHistoryOpen(false)} />}
		</AppShell>
	);
};

export const Route = createFileRoute('/settings')({
	loader: ({ context }) => context.queryClient.ensureQueryData(authQueries.me()),
	component: SettingsPage,
});

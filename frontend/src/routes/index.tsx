import { useQuery, useSuspenseQuery } from '@tanstack/react-query';
import { createFileRoute, Link, redirect } from '@tanstack/react-router';
import { z } from 'zod';
import { LoginRequiredDialog } from '@/components/Auth/organisms/LoginRequiredDialog';
import { GroupSearchSection } from '@/components/Group/organisms/GroupSearchSection';
import { MyGroupsSection } from '@/components/Group/organisms/MyGroupsSection';
import type { MyGroupsState } from '@/components/Group/organisms/MyGroupsSection';
import { GroupRequestLauncher } from '@/components/GroupRequest/organisms/GroupRequestLauncher';
import { buttonClassName } from '@/components/common/atoms/Button';
import { AppHeader } from '@/components/layout/AppHeader';
import { authQueries } from '@/modules/stores/server/auth/queries';
import { groupQueries } from '@/modules/stores/server/group/queries';
import type { AuthMe } from '@/types/Auth';
import { getGroupPath, isLeaderOfAny } from '@/utils/group';

const HOME_PATH = '/';

const mainSearchSchema = z.object({
	/** 있으면 즐겨찾기 모임으로 자동 이동하지 않고 목록을 보여준다(값은 무관, 기존 ?list=1) */
	list: z.unknown().optional(),
});

const useMyGroupsState = (me: AuthMe | null): MyGroupsState => {
	const { data: groups, isPending, isError } = useQuery({ ...groupQueries.myGroups(), enabled: !!me });
	if (!me) return { status: 'guest' };
	if (isPending) return { status: 'loading' };
	if (isError) return { status: 'error' };
	return { status: 'success', groups };
};

const MainPage = () => {
	const { data: me } = useSuspenseQuery({ ...authQueries.me() });
	const myGroups = useMyGroupsState(me);
	// 이미 모임 리더면 새 모임을 신청할 수 없으므로 버튼을 숨긴다(목록을 불러온 뒤에 판단)
	const canRequestGroup = !!me && myGroups.status === 'success' && !isLeaderOfAny(myGroups.groups, me.userKey);

	return (
		<>
			<AppHeader
				isLoggedIn={!!me}
				actions={
					me?.isAdmin && (
						<Link to="/admin" search={{ tab: 'users' }} className={buttonClassName('secondary')}>
							관리자
						</Link>
					)
				}
			/>
			<main className="mx-auto flex max-w-3xl flex-col gap-4 px-4 py-6">
				<MyGroupsSection
					state={myGroups}
					favoriteGroupId={me?.favoriteGroupId ?? null}
					actions={canRequestGroup && <GroupRequestLauncher userKey={me.userKey} groups={myGroups.groups} />}
				/>
				<GroupSearchSection isGuest={!me} />
			</main>
			{!me && <LoginRequiredDialog returnTo={HOME_PATH} />}
		</>
	);
};

export const Route = createFileRoute('/')({
	validateSearch: mainSearchSchema,
	beforeLoad: async ({ context, search }) => {
		const me = await context.queryClient.ensureQueryData(authQueries.me());
		// 즐겨찾기 모임이 있으면 바로 그 모임으로 — 모임 화면은 아직 서버 렌더링이라 문서 전체를 다시 불러온다
		if (me?.favoriteGroupId && search.list === undefined) {
			throw redirect({ href: getGroupPath(me.favoriteGroupId), reloadDocument: true });
		}
	},
	component: MainPage,
});

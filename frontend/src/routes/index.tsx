import { useQuery, useSuspenseQuery } from '@tanstack/react-query';
import { createFileRoute, redirect } from '@tanstack/react-router';
import { z } from 'zod';
import { GroupSearchSection } from '@/components/Group/organisms/GroupSearchSection';
import { MyGroupsSection } from '@/components/Group/organisms/MyGroupsSection';
import type { MyGroupsState } from '@/components/Group/organisms/MyGroupsSection';
import { GroupRequestLauncher } from '@/components/GroupRequest/organisms/GroupRequestLauncher';
import { AppShell } from '@/components/layout/AppShell';
import { APP_NAME } from '@/constants';
import { authQueries } from '@/modules/stores/server/auth/queries';
import { groupQueries } from '@/modules/stores/server/group/queries';
import type { AuthMe } from '@/types/Auth';
import { isLeaderOfAny } from '@/utils/group';

const mainSearchSchema = z.object({
	/** 있으면 즐겨찾기 모임으로 자동 이동하지 않고 목록을 보여준다(값은 무관, 기존 ?list=1) */
	list: z.unknown().optional(),
	/** 예전 로그인 안내 주소 호환용(지금은 쓰지 않는다) */
	returnTo: z.string().optional(),
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
		<AppShell title={APP_NAME} isLoggedIn={!!me}>
			{me?.nickname && (
				<p className="px-1 text-[15px] text-gray-600">
					<strong className="font-bold text-gray-900">{me.nickname}</strong>님, 오늘도 즐거운 모임 되세요.
				</p>
			)}
			<MyGroupsSection
				state={myGroups}
				favoriteGroupId={me?.favoriteGroupId ?? null}
				actions={canRequestGroup && <GroupRequestLauncher userKey={me.userKey} groups={myGroups.groups} />}
			/>
			<GroupSearchSection />
		</AppShell>
	);
};

export const Route = createFileRoute('/')({
	validateSearch: mainSearchSchema,
	beforeLoad: async ({ context, search }) => {
		const me = await context.queryClient.ensureQueryData(authQueries.me());
		// 즐겨찾기 모임이 있으면 바로 그 모임으로
		if (me?.favoriteGroupId && search.list === undefined) {
			throw redirect({
				to: '/groups/$groupId',
				params: { groupId: String(me.favoriteGroupId) },
				search: { tab: 'home' },
			});
		}
	},
	component: MainPage,
});

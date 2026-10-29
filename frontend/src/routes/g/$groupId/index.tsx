import { useSuspenseQuery } from '@tanstack/react-query';
import { createFileRoute, Link, notFound } from '@tanstack/react-router';
import { AxiosError, HttpStatusCode } from 'axios';
import { useEffect } from 'react';
import { z } from 'zod';
import { buttonClassName } from '@/components/common/atoms/Button';
import { VisibilityNotice } from '@/components/Group/molecules/VisibilityNotice';
import { GROUP_HERO_VARIANT, GroupHero } from '@/components/Group/organisms/GroupHero';
import {
	HomePanel,
	MANAGE_SECTION_KEYS,
	ManagePanel,
	MembersPanel,
	SchedulePanel,
} from '@/components/Group/organisms/GroupPanels';
import { GroupAppMePanel } from '@/components/GroupApp/organisms/GroupAppMePanel';
import { InstallBanner } from '@/components/GroupApp/organisms/InstallBanner';
import { GROUP_APP_TAB_KEYS, GroupAppShell } from '@/components/layout/GroupAppShell';
import type { GroupAppTab } from '@/components/layout/GroupAppShell';
import { ScheduleDialogs } from '@/components/Schedule/organisms/ScheduleDialogs';
import { useGroupAppHead } from '@/hooks/useGroupAppHead';
import { useScheduleDialogStore } from '@/modules/stores/client/scheduleDialog';
import { authQueries } from '@/modules/stores/server/auth/queries';
import { groupQueries } from '@/modules/stores/server/group/queries';
import type { GroupDetail } from '@/types/GroupDetail';
import { VISIBILITY_TYPE } from '@/types/GroupDetail';
import { DEFAULT_APP_COLOR } from '@/utils/appIcon';
import { getGroupName } from '@/utils/group';

const groupAppSearchSchema = z.object({
	tab: z.enum(GROUP_APP_TAB_KEYS).optional().catch(undefined),
	section: z.enum(MANAGE_SECTION_KEYS).optional().catch(undefined),
});

const parseGroupId = (raw: string): number => {
	const groupId = Number(raw);
	if (!Number.isInteger(groupId) || groupId <= 0) throw notFound();
	return groupId;
};

/** 모요라 모임 화면과 같은 규칙 + "내 정보" 탭 */
const getAvailableTabs = (detail: GroupDetail): GroupAppTab[] => [
	'home',
	...(detail.viewer.isMember || detail.visibilityType !== VISIBILITY_TYPE.PRIVATE ? (['schedule'] as const) : []),
	...(detail.viewer.isMember ? (['members'] as const) : []),
	...(detail.viewer.isManager ? (['manage'] as const) : []),
	'me',
];

/** 전용 앱이 꺼진 모임 — 모요라 모임 화면으로 안내 */
const AppUnavailable = (props: { groupId: number; name: string }) => (
	<main className="mx-auto flex max-w-xl flex-col items-start gap-4 px-4 py-12">
		<h1 className="text-xl font-bold text-gray-900">{props.name}</h1>
		<p className="text-gray-600">이 모임은 전용 앱을 제공하지 않습니다. 모요라에서 모임을 볼 수 있어요.</p>
		<Link
			to="/groups/$groupId"
			params={{ groupId: String(props.groupId) }}
			search={{ tab: 'home' }}
			className={buttonClassName('primary')}
		>
			모요라에서 보기
		</Link>
	</main>
);

const GroupAppPage = () => {
	const { groupId: rawGroupId } = Route.useParams();
	const groupId = parseGroupId(rawGroupId);
	const { tab = 'home', section = 'requests' } = Route.useSearch();
	const navigate = Route.useNavigate();
	const { data: detail } = useSuspenseQuery({ ...groupQueries.detail(groupId) });
	const { close } = useScheduleDialogStore(state => state.actions);
	const { group, viewer } = detail;
	const appName = group.appName || getGroupName(group);
	const themeColor = group.appThemeColor ?? DEFAULT_APP_COLOR;
	useGroupAppHead({ groupId, appName, themeColor, isEnabled: !!group.appEnabled });

	// 다른 모임으로 이동하거나 화면을 떠나면 열려 있던 일정 모달을 닫는다
	useEffect(() => close, [groupId, close]);

	if (!group.appEnabled) return <AppUnavailable groupId={groupId} name={getGroupName(group)} />;

	const tabs = getAvailableTabs(detail);
	const active = tabs.includes(tab) ? tab : 'home';

	const renderPanel = () => {
		switch (active) {
			case 'home':
				return (
					<>
						<InstallBanner groupId={groupId} appName={appName} themeColor={themeColor} />
						<GroupHero groupId={groupId} detail={detail} variant={GROUP_HERO_VARIANT.COMPACT} />
						{!viewer.isMember && <VisibilityNotice visibilityType={detail.visibilityType} />}
						<HomePanel groupId={groupId} detail={detail} />
					</>
				);
			case 'schedule':
				return <SchedulePanel groupId={groupId} detail={detail} />;
			case 'members':
				return <MembersPanel groupId={groupId} detail={detail} />;
			case 'manage':
				return (
					<ManagePanel
						groupId={groupId}
						detail={detail}
						section={section}
						onSectionChange={next => navigate({ search: prev => ({ ...prev, section: next }), replace: true })}
					/>
				);
			case 'me':
				return <GroupAppMePanel groupId={groupId} detail={detail} />;
			default: {
				const exhaustive: never = active;
				return exhaustive;
			}
		}
	};

	return (
		<>
			<GroupAppShell
				groupId={groupId}
				appName={appName}
				themeColor={themeColor}
				isLoggedIn={viewer.userKey !== null}
				tabs={tabs}
				activeTab={active}
			>
				{renderPanel()}
			</GroupAppShell>
			<ScheduleDialogs groupId={groupId} viewer={viewer} />
		</>
	);
};

const GroupAppNotFound = () => (
	<main className="mx-auto flex max-w-xl flex-col items-start gap-4 px-4 py-12">
		<h1 className="text-xl font-bold text-gray-900">모임을 찾을 수 없습니다.</h1>
		<Link to="/" search={{ list: 1 }} className={buttonClassName('secondary')}>
			모요라 홈으로
		</Link>
	</main>
);

/** 모임 전용 앱(모임별 PWA). 범위·시작 주소가 /g/{groupId}/ 라 끝의 / 를 지킨다(router trailingSlash: preserve) */
export const Route = createFileRoute('/g/$groupId/')({
	validateSearch: groupAppSearchSchema,
	loader: async ({ context, params }) => {
		const groupId = parseGroupId(params.groupId);
		await context.queryClient.ensureQueryData(authQueries.me());
		try {
			await context.queryClient.ensureQueryData(groupQueries.detail(groupId));
		} catch (error) {
			if (error instanceof AxiosError && error.response?.status === HttpStatusCode.NotFound) throw notFound();
			throw error;
		}
	},
	component: GroupAppPage,
	notFoundComponent: GroupAppNotFound,
});

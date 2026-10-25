import { useQuery, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { createFileRoute, Link, notFound, redirect } from '@tanstack/react-router';
import { AxiosError, HttpStatusCode } from 'axios';
import { useEffect, useState } from 'react';
import { z } from 'zod';
import { Button, buttonClassName } from '@/components/common/atoms/Button';
import { SectionCard } from '@/components/common/molecules/SectionCard';
import { Tabs } from '@/components/common/organisms/Tabs';
import type { TabItem } from '@/components/common/organisms/Tabs';
import { VisibilityNotice } from '@/components/Group/molecules/VisibilityNotice';
import { FavoriteToggle } from '@/components/Group/organisms/FavoriteToggle';
import { GroupDescription } from '@/components/Group/organisms/GroupDescription';
import { JoinAction } from '@/components/JoinRequest/organisms/JoinAction';
import { JoinRequestsSection } from '@/components/JoinRequest/organisms/JoinRequestsSection';
import { AppHeader } from '@/components/layout/AppHeader';
import { MemberInfoDialog } from '@/components/Member/organisms/MemberInfoDialog';
import { MembersManageSection } from '@/components/Member/organisms/MembersManageSection';
import { MyAttendanceDialog } from '@/components/Member/organisms/MyAttendanceDialog';
import { PermissionsSection } from '@/components/Member/organisms/PermissionsSection';
import { ScheduleCalendar } from '@/components/Schedule/organisms/ScheduleCalendar';
import { ScheduleDialogs } from '@/components/Schedule/organisms/ScheduleDialogs';
import { ScheduleManageList } from '@/components/Schedule/organisms/ScheduleManageList';
import { UpcomingSchedules } from '@/components/Schedule/organisms/UpcomingSchedules';
import { ModalType } from '@/constants';
import { useScheduleStatusChange } from '@/hooks/useScheduleStatusChange';
import { useModalStore } from '@/modules/stores/client/modal';
import { useScheduleDialogStore } from '@/modules/stores/client/scheduleDialog';
import { authQueries } from '@/modules/stores/server/auth/queries';
import { groupQueries } from '@/modules/stores/server/group/queries';
import { memberQueries } from '@/modules/stores/server/member/queries';
import { scheduleQueries } from '@/modules/stores/server/schedule/queries';
import type { GroupDetail } from '@/types/GroupDetail';
import { VISIBILITY_TYPE } from '@/types/GroupDetail';
import type { GroupMember } from '@/types/Member';
import type { Schedule, ScheduleAction } from '@/types/Schedule';
import { getGroupName } from '@/utils/group';

const GROUP_TAB_KEYS = ['home', 'schedule', 'manage'] as const;
type GroupTabKey = (typeof GROUP_TAB_KEYS)[number];

const groupSearchSchema = z.object({
	tab: z.enum(GROUP_TAB_KEYS).catch('home'),
});

const parseGroupId = (raw: string): number => {
	const groupId = Number(raw);
	if (!Number.isInteger(groupId) || groupId <= 0) throw notFound();
	return groupId;
};

/** 멤버이거나 일정이 공개인 모임만 일정 탭, 매니저 이상만 관리 탭 */
const getAvailableTabs = (detail: GroupDetail): GroupTabKey[] => [
	'home',
	...(detail.viewer.isMember || detail.visibilityType === VISIBILITY_TYPE.PUBLIC ? (['schedule'] as const) : []),
	...(detail.viewer.isManager ? (['manage'] as const) : []),
];

interface PanelProps {
	groupId: number;
	detail: GroupDetail;
}

const HomePanel = (props: PanelProps) => {
	const { groupId, detail } = props;
	const { open } = useScheduleDialogStore(state => state.actions);
	const { data: schedules, isError } = useQuery({ ...scheduleQueries.list(groupId) });

	return (
		<div className="flex flex-col gap-4">
			<GroupDescription description={detail.group.description} />
			<section aria-labelledby="upcoming-heading">
				<h2 id="upcoming-heading" className="mb-2 font-bold text-gray-900">
					스케줄
				</h2>
				<UpcomingSchedules
					groupId={groupId}
					schedules={schedules}
					isError={isError}
					isMember={detail.viewer.isMember}
					onOpen={schedule => open({ type: 'detail', scheduleId: schedule.id, fromDayMs: null })}
				/>
			</section>
		</div>
	);
};

const SchedulePanel = (props: PanelProps) => {
	const { groupId, detail } = props;
	const { open } = useScheduleDialogStore(state => state.actions);
	const { data: schedules } = useQuery({ ...scheduleQueries.list(groupId) });

	return (
		<ScheduleCalendar
			schedules={schedules ?? []}
			canFilter={detail.viewer.canManageSchedule}
			canCreate={detail.viewer.canCreateSchedule}
			// 일정이 정확히 1건이면 목록 없이 바로 상세로
			onSelectDay={(date, daySchedules) =>
				daySchedules.length === 1 && daySchedules[0]
					? open({ type: 'detail', scheduleId: daySchedules[0].id, fromDayMs: null })
					: open({ type: 'day', dateMs: date.getTime() })
			}
			onCreate={() => open({ type: 'create', dateMs: Date.now() })}
		/>
	);
};

const ManagePanel = (props: PanelProps) => {
	const { groupId, detail } = props;
	const { open } = useScheduleDialogStore(state => state.actions);
	const { data: schedules, isError } = useQuery({ ...scheduleQueries.list(groupId) });
	const changeStatus = useScheduleStatusChange(groupId);
	const listProps = {
		schedules,
		isError,
		canManage: detail.viewer.canManageSchedule,
		onOpen: (schedule: Schedule) => open({ type: 'detail', scheduleId: schedule.id, fromDayMs: null }),
		onChangeStatus: (schedule: Schedule, action: ScheduleAction) => changeStatus(schedule.id, action),
	};

	return (
		<div className="flex flex-col gap-4">
			{detail.viewer.isLeader && <JoinRequestsSection groupId={groupId} />}
			<SectionCard title="일정 승인요청">
				<ScheduleManageList {...listProps} pendingOnly emptyMessage="승인 대기 중인 일정이 없습니다." />
			</SectionCard>
			<MembersManageSection groupId={groupId} viewerIsLeader={detail.viewer.isLeader} />
			<SectionCard title="일정 관리">
				<ScheduleManageList {...listProps} pendingOnly={false} emptyMessage="일정이 없습니다." />
			</SectionCard>
			{detail.viewer.isLeader && <PermissionsSection groupId={groupId} />}
		</div>
	);
};

const PANELS = { home: HomePanel, schedule: SchedulePanel, manage: ManagePanel } as const;
const TAB_LABEL = { home: '홈', schedule: '일정', manage: '관리' } as const satisfies Record<GroupTabKey, string>;

const GroupPage = () => {
	const { groupId: rawGroupId } = Route.useParams();
	const groupId = parseGroupId(rawGroupId);
	const { tab } = Route.useSearch();
	const navigate = Route.useNavigate();
	const queryClient = useQueryClient();
	const { data: detail } = useSuspenseQuery({ ...groupQueries.detail(groupId) });
	const { close } = useScheduleDialogStore(state => state.actions);
	const openModal = useModalStore(state => state.actions.openModal);
	const [isHistoryOpen, setIsHistoryOpen] = useState(false);
	const [myInfo, setMyInfo] = useState<GroupMember | null>(null);
	const { viewer } = detail;

	// 다른 모임으로 이동하거나 화면을 떠나면 열려 있던 일정 모달을 닫는다
	useEffect(() => close, [groupId, close]);

	const available = getAvailableTabs(detail);
	const selected = available.includes(tab) ? tab : 'home';
	const tabs: readonly TabItem<GroupTabKey>[] = available.map(key => {
		const Panel = PANELS[key];
		return { key, label: TAB_LABEL[key], render: () => <Panel groupId={groupId} detail={detail} /> };
	});

	const openMyInfo = async () => {
		try {
			const members = await queryClient.fetchQuery(memberQueries.list(groupId));
			const me = members.find(member => member.userKey === viewer.userKey);
			if (me) setMyInfo(me);
			else openModal({ type: ModalType.ALERT, message: '내 정보를 찾을 수 없습니다.' });
		} catch {
			openModal({ type: ModalType.ALERT, message: '내 정보를 불러오지 못했습니다.' });
		}
	};

	return (
		<>
			<AppHeader
				isLoggedIn
				actions={
					<Link to="/" search={{ list: 1 }} className={buttonClassName('secondary')}>
						목록으로
					</Link>
				}
			/>
			<main className="mx-auto flex max-w-3xl flex-col gap-4 px-4 py-6">
				<section className="flex items-center justify-between gap-3 rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
					<h1 className="text-xl font-extrabold text-gray-900">{getGroupName(detail.group)}</h1>
					{viewer.isMember && (
						<div className="flex gap-2">
							<Button variant="secondary" className="px-3 py-1" onClick={() => setIsHistoryOpen(true)}>
								참가이력
							</Button>
							<Button variant="secondary" className="px-3 py-1" onClick={() => void openMyInfo()}>
								내정보
							</Button>
						</div>
					)}
				</section>
				{!viewer.isMember && <VisibilityNotice visibilityType={detail.visibilityType} />}
				<div>
					<Tabs
						label="모임 메뉴"
						tabs={tabs}
						selected={selected}
						onSelect={key => navigate({ search: { tab: key } })}
						actions={
							viewer.isMember ? (
								<FavoriteToggle groupId={groupId} viewer={viewer} />
							) : (
								viewer.userKey !== null && <JoinAction groupId={groupId} userKey={viewer.userKey} />
							)
						}
					/>
				</div>
			</main>
			<ScheduleDialogs groupId={groupId} viewer={viewer} />
			{isHistoryOpen && <MyAttendanceDialog groupId={groupId} onClose={() => setIsHistoryOpen(false)} />}
			{myInfo && (
				<MemberInfoDialog
					groupId={groupId}
					member={myInfo}
					canEditRole={false}
					canKick={false}
					onKick={() => {}}
					onClose={() => setMyInfo(null)}
				/>
			)}
		</>
	);
};

const GroupNotFound = () => (
	<main className="mx-auto flex max-w-xl flex-col items-start gap-4 px-4 py-12">
		<h1 className="text-xl font-bold text-gray-900">모임을 찾을 수 없습니다.</h1>
		<Link to="/" search={{ list: 1 }} className={buttonClassName('secondary')}>
			목록으로
		</Link>
	</main>
);

export const Route = createFileRoute('/groups/$groupId')({
	validateSearch: groupSearchSchema,
	beforeLoad: async ({ context, location }) => {
		const me = await context.queryClient.ensureQueryData(authQueries.me());
		// 비로그인은 메인으로 — 메인의 로그인 안내가 로그인 후 이 주소로 돌아오게 한다
		if (!me) throw redirect({ to: '/', search: { returnTo: location.href } });
	},
	loader: async ({ context, params }) => {
		const groupId = parseGroupId(params.groupId);
		try {
			await context.queryClient.ensureQueryData(groupQueries.detail(groupId));
		} catch (error) {
			if (error instanceof AxiosError && error.response?.status === HttpStatusCode.NotFound) throw notFound();
			throw error;
		}
	},
	component: GroupPage,
	notFoundComponent: GroupNotFound,
});

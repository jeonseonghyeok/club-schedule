import { useQuery } from '@tanstack/react-query';
import { SectionCard } from '@/components/common/molecules/SectionCard';
import { GroupDescription } from '@/components/Group/organisms/GroupDescription';
import { GroupSettingsSection } from '@/components/Group/organisms/GroupSettingsSection';
import { JoinRequestsSection } from '@/components/JoinRequest/organisms/JoinRequestsSection';
import { MemberListSection } from '@/components/Member/organisms/MemberListSection';
import { MembersManageSection } from '@/components/Member/organisms/MembersManageSection';
import { PermissionsSection } from '@/components/Member/organisms/PermissionsSection';
import { ScheduleCalendar } from '@/components/Schedule/organisms/ScheduleCalendar';
import { ScheduleManageList } from '@/components/Schedule/organisms/ScheduleManageList';
import { UpcomingSchedules } from '@/components/Schedule/organisms/UpcomingSchedules';
import { useScheduleStatusChange } from '@/hooks/useScheduleStatusChange';
import { useScheduleDialogStore } from '@/modules/stores/client/scheduleDialog';
import { joinRequestQueries } from '@/modules/stores/server/joinRequest/queries';
import { scheduleQueries } from '@/modules/stores/server/schedule/queries';
import type { GroupDetail } from '@/types/GroupDetail';
import { SCHEDULE_STATUS } from '@/types/Schedule';
import type { Schedule, ScheduleAction } from '@/types/Schedule';
import { cn } from '@/utils';

export const MANAGE_SECTION_KEYS = ['requests', 'members', 'schedules', 'settings'] as const;
export type ManageSection = (typeof MANAGE_SECTION_KEYS)[number];

const MANAGE_SECTION_LABEL = {
	requests: '요청',
	members: '회원',
	schedules: '일정',
	settings: '설정',
} as const satisfies Record<ManageSection, string>;

interface PanelProps {
	groupId: number;
	detail: GroupDetail;
}

export const HomePanel = (props: PanelProps) => {
	const { groupId, detail } = props;
	const { open } = useScheduleDialogStore(state => state.actions);
	const { data: schedules, isError } = useQuery({ ...scheduleQueries.list(groupId) });

	return (
		<div className="flex flex-col gap-4">
			<SectionCard title="소개">
				<GroupDescription description={detail.group.description} />
			</SectionCard>
			<SectionCard title="다가오는 일정">
				<UpcomingSchedules
					groupId={groupId}
					schedules={schedules}
					isError={isError}
					isMember={detail.viewer.isMember}
					onOpen={schedule => open({ type: 'detail', scheduleId: schedule.id, fromDayMs: null })}
				/>
			</SectionCard>
		</div>
	);
};

export const SchedulePanel = (props: PanelProps) => {
	const { groupId, detail } = props;
	const { open } = useScheduleDialogStore(state => state.actions);
	const { data: schedules } = useQuery({ ...scheduleQueries.list(groupId) });

	return (
		<div className="rounded-2xl bg-white p-3 ring-1 ring-gray-200 sm:p-5">
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
		</div>
	);
};

export const MembersPanel = (props: PanelProps) => (
	<MemberListSection groupId={props.groupId} viewerUserKey={props.detail.viewer.userKey} />
);

interface ManagePanelProps extends PanelProps {
	section: ManageSection;
	onSectionChange: (section: ManageSection) => void;
}

/** 승인 대기 건수(가입 요청은 리더만 처리하므로 리더에게만 센다) — 관리 하위 메뉴 배지 */
const usePendingCount = (groupId: number, isLeader: boolean): number => {
	const { data: schedules } = useQuery({ ...scheduleQueries.list(groupId) });
	const { data: joins } = useQuery({ ...joinRequestQueries.pending(groupId), enabled: isLeader });
	const pendingSchedules = schedules?.filter(schedule => schedule.status === SCHEDULE_STATUS.PENDING).length ?? 0;
	return pendingSchedules + (isLeader ? (joins?.length ?? 0) : 0);
};

/** 관리 탭: 요청(가입·일정 승인) / 회원 / 일정 / 설정 으로 나눠 한 화면이 길어지지 않게 한다 */
export const ManagePanel = (props: ManagePanelProps) => {
	const { groupId, detail, section, onSectionChange } = props;
	const { viewer } = detail;
	const { open } = useScheduleDialogStore(state => state.actions);
	const { data: schedules, isError } = useQuery({ ...scheduleQueries.list(groupId) });
	const changeStatus = useScheduleStatusChange(groupId);
	const pendingCount = usePendingCount(groupId, viewer.isLeader);
	const listProps = {
		schedules,
		isError,
		canManage: viewer.canManageSchedule,
		onOpen: (schedule: Schedule) => open({ type: 'detail', scheduleId: schedule.id, fromDayMs: null }),
		onChangeStatus: (schedule: Schedule, action: ScheduleAction) => changeStatus(schedule.id, action),
	};

	const renderSection = () => {
		switch (section) {
			case 'requests':
				return (
					<>
						{viewer.isLeader && <JoinRequestsSection groupId={groupId} />}
						<SectionCard title="일정 승인요청">
							<ScheduleManageList {...listProps} pendingOnly emptyMessage="승인 대기 중인 일정이 없습니다." />
						</SectionCard>
					</>
				);
			case 'members':
				return (
					<>
						<MembersManageSection groupId={groupId} viewerIsLeader={viewer.isLeader} />
						{viewer.isLeader && <PermissionsSection groupId={groupId} />}
					</>
				);
			case 'schedules':
				return (
					<SectionCard title="일정 관리">
						<ScheduleManageList {...listProps} pendingOnly={false} emptyMessage="일정이 없습니다." />
					</SectionCard>
				);
			case 'settings':
				return <GroupSettingsSection groupId={groupId} viewerIsLeader={viewer.isLeader} />;
			default: {
				const exhaustive: never = section;
				return exhaustive;
			}
		}
	};

	return (
		<div className="flex flex-col gap-4">
			<nav aria-label="관리 메뉴" className="flex gap-2 overflow-x-auto [scrollbar-width:none]">
				{MANAGE_SECTION_KEYS.map(key => {
					const isSelected = key === section;
					return (
						<button
							key={key}
							type="button"
							aria-pressed={isSelected}
							onClick={() => onSectionChange(key)}
							className={cn(
								'flex min-h-9 shrink-0 items-center gap-1.5 rounded-full px-4 text-sm font-semibold ring-1 transition-colors focus-visible:outline-2 focus-visible:outline-brand-600',
								isSelected
									? 'bg-gray-900 text-white ring-gray-900'
									: 'bg-white text-gray-700 ring-gray-200 hover:bg-gray-50',
							)}
						>
							{MANAGE_SECTION_LABEL[key]}
							{key === 'requests' && pendingCount > 0 && (
								<span
									className={cn(
										'min-w-5 rounded-full px-1.5 text-center text-[11px] leading-5 font-bold',
										isSelected ? 'bg-white text-gray-900' : 'bg-red-600 text-white',
									)}
								>
									{pendingCount}
									<span className="sr-only">건 대기</span>
								</span>
							)}
						</button>
					);
				})}
			</nav>
			{renderSection()}
		</div>
	);
};

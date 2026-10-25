import { Button } from '@/components/common/atoms/Button';
import { EmptyMessage } from '@/components/common/atoms/EmptyMessage';
import { ScheduleStatusBadge } from '@/components/Schedule/atoms/ScheduleStatusBadge';
import { SCHEDULE_STATUS } from '@/types/Schedule';
import type { Schedule, ScheduleAction } from '@/types/Schedule';
import { formatDateTime } from '@/utils/date';
import { getScheduleTitle } from '@/utils/schedule';

interface Props {
	schedules: readonly Schedule[] | undefined;
	isError: boolean;
	/** 승인 대기만 보여줄지(관리 탭 상단 위젯) */
	pendingOnly: boolean;
	canManage: boolean;
	emptyMessage: string;
	onOpen: (schedule: Schedule) => void;
	onChangeStatus: (schedule: Schedule, action: ScheduleAction) => void;
}

/** 관리 탭: 일정 승인요청 위젯 / 일정 관리 목록 — 대기 일정은 목록에서 바로 승인·반려 */
export const ScheduleManageList = (props: Props) => {
	const { schedules, isError, pendingOnly, canManage, emptyMessage, onOpen, onChangeStatus } = props;
	if (isError) return <EmptyMessage message="일정을 불러오지 못했습니다." />;
	if (!schedules) return <EmptyMessage message="로딩 중..." />;
	const rows = pendingOnly ? schedules.filter(schedule => schedule.status === SCHEDULE_STATUS.PENDING) : schedules;
	if (rows.length === 0) return <EmptyMessage message={emptyMessage} />;

	return (
		<ul className="divide-y divide-gray-100">
			{rows.map(schedule => (
				<li key={schedule.id} className="flex items-center justify-between gap-2 py-2">
					<button
						type="button"
						onClick={() => onOpen(schedule)}
						className="min-w-0 flex-1 rounded-md text-left hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-gray-900"
					>
						<span className="block truncate font-semibold text-gray-900">{getScheduleTitle(schedule)}</span>
						<span className="flex items-center gap-2 text-xs text-gray-500">
							{formatDateTime(new Date(schedule.start).toISOString())}
							{!pendingOnly && <ScheduleStatusBadge status={schedule.status} />}
						</span>
					</button>
					{canManage && schedule.status === SCHEDULE_STATUS.PENDING && (
						<span className="flex shrink-0 gap-1">
							<Button
								className="px-3 py-1"
								aria-label={`${getScheduleTitle(schedule)} 승인`}
								onClick={() => onChangeStatus(schedule, 'approve')}
							>
								승인
							</Button>
							<Button
								variant="danger"
								className="px-3 py-1"
								aria-label={`${getScheduleTitle(schedule)} 반려`}
								onClick={() => onChangeStatus(schedule, 'reject')}
							>
								반려
							</Button>
						</span>
					)}
				</li>
			))}
		</ul>
	);
};

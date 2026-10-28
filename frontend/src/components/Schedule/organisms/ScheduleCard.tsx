import { InfoLine } from '@/components/Schedule/atoms/InfoLine';
import { AttendanceButton } from '@/components/Schedule/molecules/AttendanceButton';
import { RosterPopover } from '@/components/Schedule/molecules/RosterPopover';
import { SCHEDULE_STATUS } from '@/types/Schedule';
import type { Schedule } from '@/types/Schedule';
import { cn } from '@/utils';
import { formatAmPmTime, formatCapacity, getScheduleTitle } from '@/utils/schedule';

const STATUS_BORDER = {
	PENDING: 'border-l-yellow-500',
	CONFIRMED: 'border-l-green-500',
	REJECTED: 'border-l-red-500',
	CANCELLED: 'border-l-gray-400',
} as const;

interface Props {
	groupId: number;
	schedule: Schedule;
	isMember: boolean;
	/** "오늘", "3일 후" 같은 앞머리 배지 */
	dayBadge?: string;
	onOpen: (schedule: Schedule) => void;
}

/** 홈 탭 임박 일정·날짜별 목록에 쓰는 일정 카드 */
export const ScheduleCard = (props: Props) => {
	const { groupId, schedule, isMember, dayBadge, onOpen } = props;
	const canAttend = isMember && schedule.status === SCHEDULE_STATUS.CONFIRMED;
	const title = getScheduleTitle(schedule);

	return (
		<article
			className={cn(
				'flex items-center justify-between gap-3 rounded-lg border border-l-4 border-gray-200 bg-white p-3',
				STATUS_BORDER[schedule.status],
			)}
		>
			<div className="flex min-w-0 flex-1 flex-col gap-0.5">
				<h3 className="flex items-center gap-1.5">
					{dayBadge && (
						<span
							className={cn(
								'shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold',
								dayBadge === '오늘' ? 'bg-brand-600 text-white' : 'bg-brand-50 text-brand-800',
							)}
						>
							{dayBadge}
						</span>
					)}
					<button
						type="button"
						onClick={() => onOpen(schedule)}
						className="truncate text-left text-sm font-bold text-gray-900 hover:underline focus-visible:outline-2 focus-visible:outline-gray-900"
					>
						{title}
					</button>
				</h3>
				<InfoLine label="시작시간">{formatAmPmTime(schedule.start)}</InfoLine>
				<InfoLine label="모임장소">{schedule.locationName || '-'}</InfoLine>
				<div className="flex gap-2 text-xs">
					<span className="w-14 shrink-0 text-gray-400">참가인원</span>
					{canAttend ? (
						<RosterPopover
							groupId={groupId}
							scheduleId={schedule.id}
							confirmedCount={schedule.confirmedCount}
							maxAttendance={schedule.maxAttendance}
						/>
					) : (
						<span className="text-gray-700">{formatCapacity(schedule.confirmedCount, schedule.maxAttendance)}</span>
					)}
				</div>
			</div>
			{canAttend && <AttendanceButton groupId={groupId} schedule={schedule} size="compact" />}
		</article>
	);
};

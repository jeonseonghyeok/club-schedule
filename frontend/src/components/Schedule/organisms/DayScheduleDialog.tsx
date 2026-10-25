import { Button } from '@/components/common/atoms/Button';
import { EmptyMessage } from '@/components/common/atoms/EmptyMessage';
import { Dialog } from '@/components/common/organisms/Dialog';
import { ScheduleCard } from '@/components/Schedule/organisms/ScheduleCard';
import type { GroupViewer } from '@/types/GroupDetail';
import type { Schedule } from '@/types/Schedule';
import { toDateKey } from '@/utils/schedule';

interface Props {
	groupId: number;
	date: Date;
	schedules: readonly Schedule[];
	viewer: GroupViewer;
	onOpen: (schedule: Schedule) => void;
	onCreate: () => void;
	onClose: () => void;
}

export const DayScheduleDialog = (props: Props) => {
	const { groupId, date, schedules, viewer, onOpen, onCreate, onClose } = props;
	const sorted = [...schedules].sort((a, b) => a.start - b.start);

	return (
		<Dialog title={`${toDateKey(date)} 일정`} size="md" onClose={onClose}>
			<div className="flex flex-col gap-2">
				{sorted.length === 0 ? (
					<EmptyMessage message="이 날짜에 등록된 일정이 없습니다." />
				) : (
					sorted.map(schedule => (
						<ScheduleCard
							key={schedule.id}
							groupId={groupId}
							schedule={schedule}
							isMember={viewer.isMember}
							onOpen={onOpen}
						/>
					))
				)}
				{viewer.canCreateSchedule && (
					<Button onClick={onCreate} className="mt-1 w-1/2 self-center">
						일정추가
					</Button>
				)}
			</div>
		</Dialog>
	);
};

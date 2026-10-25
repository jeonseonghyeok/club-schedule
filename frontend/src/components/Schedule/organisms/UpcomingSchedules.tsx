import { useState } from 'react';
import { EmptyMessage } from '@/components/common/atoms/EmptyMessage';
import { ScheduleCard } from '@/components/Schedule/organisms/ScheduleCard';
import type { Schedule } from '@/types/Schedule';
import { formatRelativeDay, getUpcomingConfirmed } from '@/utils/schedule';

interface Props {
	groupId: number;
	schedules: readonly Schedule[] | undefined;
	isError: boolean;
	isMember: boolean;
	onOpen: (schedule: Schedule) => void;
}

/** 홈 탭: 다가오는 확정 일정 3개 */
export const UpcomingSchedules = (props: Props) => {
	const { groupId, schedules, isError, isMember, onOpen } = props;
	const [now] = useState(() => new Date());

	if (isError) return <EmptyMessage message="일정을 불러오지 못했습니다." />;
	if (!schedules) return <EmptyMessage message="로딩 중..." />;
	const upcoming = getUpcomingConfirmed(schedules, now.getTime());
	if (upcoming.length === 0) return <EmptyMessage message="임박한 일정이 없습니다." />;

	return (
		<ul className="flex flex-col gap-2">
			{upcoming.map(schedule => (
				<li key={schedule.id}>
					<ScheduleCard
						groupId={groupId}
						schedule={schedule}
						isMember={isMember}
						dayBadge={formatRelativeDay(schedule.start, now)}
						onOpen={onOpen}
					/>
				</li>
			))}
		</ul>
	);
};

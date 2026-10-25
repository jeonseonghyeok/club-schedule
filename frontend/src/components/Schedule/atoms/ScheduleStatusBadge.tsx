import type { ScheduleStatus } from '@/types/Schedule';
import { cn } from '@/utils';
import { SCHEDULE_STATUS_LABEL, STATUS_TONE_CLASS } from '@/utils/schedule';

interface Props {
	status: ScheduleStatus;
}

export const ScheduleStatusBadge = (props: Props) => (
	<span
		className={cn('inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold', STATUS_TONE_CLASS[props.status])}
	>
		{SCHEDULE_STATUS_LABEL[props.status]}
	</span>
);

import type { GroupRequestStatus } from '@/types/GroupRequest';
import { cn } from '@/utils';
import { GROUP_REQUEST_STATUS_LABEL } from '@/utils/groupRequest';

const STATUS_CLASS = {
	PENDING: 'bg-amber-100 text-amber-800',
	APPROVED: 'bg-green-100 text-green-800',
	REJECTED: 'bg-red-100 text-red-800',
	CANCELLED: 'bg-gray-100 text-gray-700',
} as const satisfies Record<GroupRequestStatus, string>;

interface Props {
	status: GroupRequestStatus;
}

// 색과 함께 텍스트 라벨을 항상 보여준다(색만으로 상태를 전달하지 않음).
export const GroupRequestStatusBadge = (props: Props) => (
	<span className={cn('shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold', STATUS_CLASS[props.status])}>
		{GROUP_REQUEST_STATUS_LABEL[props.status]}
	</span>
);

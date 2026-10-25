import { Dialog } from '@/components/common/organisms/Dialog';
import { GROUP_REQUEST_STATUS } from '@/types/GroupRequest';
import type { GroupRequest } from '@/types/GroupRequest';
import { formatDateTime } from '@/utils/date';
import { getGroupName } from '@/utils/group';
import { GROUP_REQUEST_STATUS_CHANGE_LABEL } from '@/utils/groupRequest';

interface Props {
	request: GroupRequest;
	onClose: () => void;
}

export const GroupRequestDetailDialog = (props: Props) => {
	const { request, onClose } = props;
	const rows = [
		{ label: '모임명', value: getGroupName({ name: request.groupName }) },
		{ label: '모임설명', value: request.description ?? '' },
		{ label: '신청일자', value: formatDateTime(request.requestedAt) },
		{
			label: '상태 변경일자',
			value: `${GROUP_REQUEST_STATUS_CHANGE_LABEL[request.status]}: ${formatDateTime(request.statusUpdatedAt)}`,
		},
		...(request.status === GROUP_REQUEST_STATUS.REJECTED
			? [{ label: '반려 사유', value: request.rejectReason ?? '' }]
			: []),
	];

	return (
		<Dialog title="신청상세" size="md" onClose={onClose}>
			<dl className="flex flex-col gap-4">
				{rows.map(row => (
					<div key={row.label}>
						<dt className="text-xs font-semibold text-gray-500">{row.label}</dt>
						<dd className="mt-1 whitespace-pre-wrap text-gray-900">{row.value}</dd>
					</div>
				))}
			</dl>
		</Dialog>
	);
};

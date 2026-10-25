import { Button } from '@/components/common/atoms/Button';
import { Dialog } from '@/components/common/organisms/Dialog';
import type { AdminGroupRequest } from '@/types/Admin';
import { GROUP_REQUEST_STATUS } from '@/types/GroupRequest';
import { ADMIN_STATUS_LABEL, formatOptional } from '@/utils/admin';
import { formatDateTime } from '@/utils/date';
import { getGroupPath } from '@/utils/group';

interface Props {
	request: AdminGroupRequest;
	onApprove: (request: AdminGroupRequest) => void;
	onReject: (request: AdminGroupRequest) => void;
	onClose: () => void;
}

interface Row {
	readonly label: string;
	readonly value: string;
}

const buildRows = (request: AdminGroupRequest): Row[] => {
	const rows: Row[] = [
		{ label: '신청번호', value: String(request.requestId) },
		{ label: '모임명', value: formatOptional(request.groupName) },
		{ label: '요청자(userKey)', value: String(request.userKey) },
		{ label: '신청 설명', value: formatOptional(request.description) },
		{ label: '신청일시', value: formatDateTime(request.requestedAt) },
		{ label: '상태', value: ADMIN_STATUS_LABEL[request.status] },
	];
	// 처리 결과는 승인대기가 아닐 때만 의미가 있다
	if (request.status !== GROUP_REQUEST_STATUS.PENDING) {
		rows.push(
			{ label: '처리자(userKey)', value: formatOptional(request.updatedBy) },
			{ label: '상태 변경일시', value: formatDateTime(request.statusUpdatedAt) },
		);
	}
	if (request.status === GROUP_REQUEST_STATUS.REJECTED) {
		rows.push({ label: '거부 사유', value: formatOptional(request.rejectReason) });
	}
	return rows;
};

export const GroupRequestReviewDialog = (props: Props) => {
	const { request, onApprove, onReject, onClose } = props;

	return (
		<Dialog title="그룹 신청 상세" size="md" onClose={onClose}>
			<dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
				{buildRows(request).map(row => (
					<div key={row.label} className="contents">
						<dt className="font-semibold whitespace-nowrap text-gray-500">{row.label}</dt>
						<dd className="break-words whitespace-pre-wrap text-gray-900">{row.value}</dd>
					</div>
				))}
			</dl>
			{request.status === GROUP_REQUEST_STATUS.PENDING && (
				<div className="mt-5 flex justify-end gap-2">
					<Button onClick={() => onApprove(request)}>승인</Button>
					<Button variant="danger" onClick={() => onReject(request)}>
						거부
					</Button>
				</div>
			)}
			{request.status === GROUP_REQUEST_STATUS.APPROVED && request.groupId && (
				<a
					href={getGroupPath(request.groupId)}
					target="_blank"
					rel="noreferrer"
					className="mt-4 inline-block font-semibold text-blue-700 hover:underline focus-visible:outline-2 focus-visible:outline-gray-900"
				>
					모임 바로가기 →
				</a>
			)}
		</Dialog>
	);
};

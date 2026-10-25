import { Button } from '@/components/common/atoms/Button';
import { EmptyMessage } from '@/components/common/atoms/EmptyMessage';
import { Dialog } from '@/components/common/organisms/Dialog';
import { GroupRequestStatusBadge } from '@/components/GroupRequest/molecules/GroupRequestStatusBadge';
import { GROUP_REQUEST_STATUS } from '@/types/GroupRequest';
import type { GroupRequest } from '@/types/GroupRequest';
import { formatDateTime } from '@/utils/date';
import { getGroupName } from '@/utils/group';
import { sortByLatestRequested } from '@/utils/groupRequest';

export type GroupRequestListState =
	{ status: 'loading' } | { status: 'error' } | { status: 'success'; requests: readonly GroupRequest[] };

interface Props {
	state: GroupRequestListState;
	onCreate: () => void;
	onSelect: (request: GroupRequest) => void;
	onCancelRequest: (request: GroupRequest) => void;
	onClose: () => void;
}

const getMetaText = (request: GroupRequest): string => {
	const parts = [formatDateTime(request.requestedAt, '')];
	if (request.status === GROUP_REQUEST_STATUS.REJECTED) {
		if (request.rejectReason) parts.push(`반려사유: ${request.rejectReason}`);
		if (request.statusUpdatedAt) parts.push(`반려시간: ${formatDateTime(request.statusUpdatedAt)}`);
	}
	return parts.filter(Boolean).join(' • ');
};

interface RequestItemProps {
	request: GroupRequest;
	onSelect: (request: GroupRequest) => void;
	onCancelRequest: (request: GroupRequest) => void;
}

const RequestItem = (props: RequestItemProps) => {
	const { request, onSelect, onCancelRequest } = props;
	const groupName = getGroupName({ name: request.groupName });

	return (
		<li className="flex items-start gap-2 py-3">
			<button
				type="button"
				onClick={() => onSelect(request)}
				aria-label={`${groupName} 신청 상세 보기`}
				className="flex min-w-0 flex-1 flex-col items-stretch rounded-md text-left hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-gray-900"
			>
				<span className="flex items-center justify-between gap-2">
					<span className="truncate font-semibold text-gray-900">{groupName}</span>
					<GroupRequestStatusBadge status={request.status} />
				</span>
				<span className="mt-1 text-sm text-gray-500">{getMetaText(request)}</span>
			</button>
			{request.status === GROUP_REQUEST_STATUS.PENDING && (
				<Button variant="secondary" onClick={() => onCancelRequest(request)}>
					신청 취소
				</Button>
			)}
		</li>
	);
};

export const GroupRequestStatusDialog = (props: Props) => {
	const { state, onCreate, onSelect, onCancelRequest, onClose } = props;

	const renderBody = () => {
		switch (state.status) {
			case 'loading':
				return <EmptyMessage message="로딩 중..." />;
			case 'error':
				return <EmptyMessage message="신청 현황을 불러오는데 실패했습니다." />;
			case 'success':
				if (state.requests.length === 0) return <EmptyMessage message="신청 내역이 없습니다." />;
				return (
					<ul className="divide-y divide-gray-100">
						{sortByLatestRequested(state.requests).map(request => (
							<RequestItem
								key={request.requestId}
								request={request}
								onSelect={onSelect}
								onCancelRequest={onCancelRequest}
							/>
						))}
					</ul>
				);
			default: {
				const exhaustive: never = state;
				return exhaustive;
			}
		}
	};

	return (
		<Dialog
			title="신청현황"
			size="md"
			onClose={onClose}
			headerActions={
				<Button onClick={onCreate} disabled={state.status === 'loading'}>
					신청하기
				</Button>
			}
		>
			{renderBody()}
		</Dialog>
	);
};

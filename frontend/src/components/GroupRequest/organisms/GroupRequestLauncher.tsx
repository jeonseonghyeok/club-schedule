import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Button } from '@/components/common/atoms/Button';
import { GroupRequestCreateDialog } from '@/components/GroupRequest/organisms/GroupRequestCreateDialog';
import { GroupRequestDetailDialog } from '@/components/GroupRequest/organisms/GroupRequestDetailDialog';
import { GroupRequestStatusDialog } from '@/components/GroupRequest/organisms/GroupRequestStatusDialog';
import type { GroupRequestListState } from '@/components/GroupRequest/organisms/GroupRequestStatusDialog';
import { ModalType } from '@/constants';
import { useModalStore } from '@/modules/stores/client/modal';
import { useCancelGroupRequest, useCreateGroupRequest } from '@/modules/stores/server/groupRequest/mutations';
import { groupRequestQueries } from '@/modules/stores/server/groupRequest/queries';
import type { Group } from '@/types/Group';
import type { GroupRequest, GroupRequestCreatePayload } from '@/types/GroupRequest';
import { getGroupRequestBlockReason } from '@/utils/groupRequest';

type View = 'closed' | 'status' | 'create';

interface Props {
	userKey: number;
	groups: readonly Group[];
}

/** "신규모임 생성" 버튼과 신청현황 → (상세 | 신청하기) 모달 흐름 */
export const GroupRequestLauncher = (props: Props) => {
	const { userKey, groups } = props;
	const [view, setView] = useState<View>('closed');
	const [selectedRequest, setSelectedRequest] = useState<GroupRequest | null>(null);
	const openModal = useModalStore(state => state.actions.openModal);
	const requestsQuery = useQuery({ ...groupRequestQueries.myRequests(), enabled: view !== 'closed' });
	const { mutate: createRequest, isPending: isCreating } = useCreateGroupRequest();
	const { mutate: cancelRequest } = useCancelGroupRequest();

	const listState: GroupRequestListState = requestsQuery.isPending
		? { status: 'loading' }
		: requestsQuery.isError
			? { status: 'error' }
			: { status: 'success', requests: requestsQuery.data };

	const openCreate = () => {
		const blockReason = getGroupRequestBlockReason({ requests: requestsQuery.data ?? [], groups, userKey });
		if (blockReason) {
			openModal({ type: ModalType.ALERT, message: blockReason });
			return;
		}
		setSelectedRequest(null);
		setView('create');
	};

	const submitCreate = (payload: GroupRequestCreatePayload) =>
		createRequest(payload, { onSuccess: () => setView('status') });

	const confirmCancel = (request: GroupRequest) =>
		openModal({
			type: ModalType.CONFIRM,
			message: '정말 신청을 취소하시겠습니까?',
			confirmLabel: '신청 취소',
			onConfirm: () => cancelRequest(request.requestId),
		});

	const close = () => {
		setSelectedRequest(null);
		setView('closed');
	};

	return (
		<>
			<Button onClick={() => setView('status')}>신규모임 생성</Button>
			{view === 'status' && (
				<GroupRequestStatusDialog
					state={listState}
					onCreate={openCreate}
					onSelect={setSelectedRequest}
					onCancelRequest={confirmCancel}
					onClose={close}
				/>
			)}
			{view === 'status' && selectedRequest && (
				<GroupRequestDetailDialog request={selectedRequest} onClose={() => setSelectedRequest(null)} />
			)}
			{view === 'create' && (
				<GroupRequestCreateDialog isSubmitting={isCreating} onSubmit={submitCreate} onClose={() => setView('status')} />
			)}
		</>
	);
};

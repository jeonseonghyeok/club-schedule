import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Button } from '@/components/common/atoms/Button';
import { EmptyMessage } from '@/components/common/atoms/EmptyMessage';
import { SectionCard } from '@/components/common/molecules/SectionCard';
import { ReasonDialog } from '@/components/common/organisms/ReasonDialog';
import { ModalType } from '@/constants';
import { useModalStore } from '@/modules/stores/client/modal';
import { useApproveJoinRequest, useRejectJoinRequest } from '@/modules/stores/server/joinRequest/mutations';
import { joinRequestQueries } from '@/modules/stores/server/joinRequest/queries';
import type { JoinRequest } from '@/types/JoinRequest';
import { formatDateTime } from '@/utils/date';

interface Props {
	groupId: number;
}

const nameOf = (request: JoinRequest): string => request.nickname || `사용자 #${request.userKey}`;

/** 리더 전용: 이 모임의 승인대기 가입 요청 */
export const JoinRequestsSection = (props: Props) => {
	const { groupId } = props;
	const [rejecting, setRejecting] = useState<JoinRequest | null>(null);
	const openModal = useModalStore(state => state.actions.openModal);
	const { data: requests, isError } = useQuery({ ...joinRequestQueries.pending(groupId) });
	const { mutate: approve } = useApproveJoinRequest(groupId);
	const { mutate: reject, isPending: isRejecting } = useRejectJoinRequest(groupId);

	const renderBody = () => {
		if (isError) return <EmptyMessage message="가입 요청을 불러오지 못했습니다." />;
		if (!requests) return <EmptyMessage message="로딩 중..." />;
		if (requests.length === 0) return <EmptyMessage message="대기중인 가입 요청이 없습니다." />;
		return (
			<ul className="divide-y divide-gray-100">
				{requests.map(request => (
					<li key={request.requestId} className="flex items-center justify-between gap-2 py-2">
						<div>
							<p className="font-semibold">{nameOf(request)}</p>
							<p className="text-xs text-gray-500">{formatDateTime(request.requestedAt)}</p>
						</div>
						<span className="flex shrink-0 gap-1">
							<Button
								className="px-3 py-1"
								aria-label={`${nameOf(request)} 가입 승인`}
								onClick={() =>
									openModal({
										type: ModalType.CONFIRM,
										message: '이 사용자의 가입 신청을 승인하시겠습니까?',
										confirmLabel: '예, 승인',
										onConfirm: () => approve(request.requestId),
									})
								}
							>
								승인
							</Button>
							<Button
								variant="danger"
								className="px-3 py-1"
								aria-label={`${nameOf(request)} 가입 거부`}
								onClick={() => setRejecting(request)}
							>
								거부
							</Button>
						</span>
					</li>
				))}
			</ul>
		);
	};

	return (
		<SectionCard title="가입 요청">
			{renderBody()}
			{rejecting && (
				<ReasonDialog
					title="가입 요청 거부"
					confirmLabel="거부 확인"
					isReasonRequired
					isSubmitting={isRejecting}
					onSubmit={rejectReason =>
						reject({ requestId: rejecting.requestId, rejectReason }, { onSuccess: () => setRejecting(null) })
					}
					onClose={() => setRejecting(null)}
				/>
			)}
		</SectionCard>
	);
};

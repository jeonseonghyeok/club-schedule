import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/common/atoms/Button';
import { ModalType } from '@/constants';
import { useModalStore } from '@/modules/stores/client/modal';
import { useCancelJoinRequest, useCreateJoinRequest } from '@/modules/stores/server/joinRequest/mutations';
import { joinRequestQueries } from '@/modules/stores/server/joinRequest/queries';
import { JOIN_STATUS } from '@/types/JoinRequest';

interface Props {
	groupId: number;
	userKey: number;
}

/** 비회원: 가입 신청 / 신청 중이면 취소 / 거부됐으면 사유 확인 후 재신청 */
export const JoinAction = (props: Props) => {
	const { groupId, userKey } = props;
	const openModal = useModalStore(state => state.actions.openModal);
	const { data: requests, isPending } = useQuery({ ...joinRequestQueries.mine(groupId) });
	const { mutate: requestJoin, isPending: isRequesting } = useCreateJoinRequest({ groupId, userKey });
	const { mutate: cancelJoin, isPending: isCancelling } = useCancelJoinRequest(groupId);
	if (isPending) return null;
	const latest = requests?.[0];

	if (latest?.status === JOIN_STATUS.PENDING) {
		return (
			<Button
				variant="secondary"
				disabled={isCancelling}
				onClick={() =>
					openModal({
						type: ModalType.CONFIRM,
						message: '현재 가입신청 진행 중입니다.\n가입신청을 취소하시겠습니까?',
						confirmLabel: '예(가입취소)',
						onConfirm: () => cancelJoin(latest.requestId),
					})
				}
				className="rounded-full bg-amber-50 text-amber-900 ring-amber-200"
			>
				가입 신청 중
			</Button>
		);
	}

	return (
		<span className="flex items-center gap-2">
			{latest?.status === JOIN_STATUS.REJECTED && (
				<Button
					variant="secondary"
					onClick={() =>
						openModal({ type: ModalType.ALERT, message: latest.rejectReason || '거부 사유가 등록되지 않았습니다.' })
					}
					className="rounded-full bg-red-50 text-red-800 ring-red-200"
				>
					가입 거부됨
				</Button>
			)}
			<Button
				disabled={isRequesting}
				onClick={() =>
					openModal({
						type: ModalType.CONFIRM,
						message: '이 모임에 가입 신청하시겠습니까?',
						confirmLabel: '예',
						onConfirm: () => requestJoin(),
					})
				}
			>
				가입하기
			</Button>
		</span>
	);
};

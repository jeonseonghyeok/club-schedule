import { Button } from '@/components/common/atoms/Button';
import { ModalType } from '@/constants';
import { useModalStore } from '@/modules/stores/client/modal';
import { useAttend, useCancelAttendance } from '@/modules/stores/server/attendance/mutations';
import { ATTENDANCE_STATUS } from '@/types/Schedule';
import type { Schedule } from '@/types/Schedule';
import { cn } from '@/utils';

export const ATTENDANCE_BUTTON_SIZE = { COMPACT: 'compact', FULL: 'full' } as const;
export type AttendanceButtonSize = (typeof ATTENDANCE_BUTTON_SIZE)[keyof typeof ATTENDANCE_BUTTON_SIZE];

interface Props {
	groupId: number;
	schedule: Schedule;
	/** compact: 목록 카드용 알약형, full: 상세 화면용 */
	size: AttendanceButtonSize;
}

const isAttending = (schedule: Schedule): boolean =>
	schedule.myAttendanceStatus === ATTENDANCE_STATUS.PENDING ||
	schedule.myAttendanceStatus === ATTENDANCE_STATUS.CONFIRMED;

/** 내 참가 상태에 따라 참가 신청 / 재신청 / 참가 취소 */
export const AttendanceButton = (props: Props) => {
	const { groupId, schedule, size } = props;
	const openModal = useModalStore(state => state.actions.openModal);
	const { mutate: attend, isPending: isAttendPending } = useAttend(groupId);
	const { mutate: cancel, isPending: isCancelPending } = useCancelAttendance(groupId);
	const isCompact = size === ATTENDANCE_BUTTON_SIZE.COMPACT;
	// 처리 중 중복 클릭으로 이미 처리된 신청에 재요청이 나가지 않도록 막는다
	const isBusy = isAttendPending || isCancelPending;
	const sizeClass = isCompact ? 'rounded-full px-3.5 py-1.5 text-xs' : 'w-1/2 self-center';

	if (isAttending(schedule)) {
		const isWaiting = schedule.myAttendanceStatus === ATTENDANCE_STATUS.PENDING;
		const confirmCancel = () =>
			openModal({
				type: ModalType.CONFIRM,
				message: '참가를 취소하시겠습니까?',
				confirmLabel: '참가 취소',
				onConfirm: () =>
					cancel(schedule.id, {
						onSuccess: () => !isCompact && openModal({ type: ModalType.ALERT, message: '참가 취소되었습니다.' }),
					}),
			});
		return (
			<span className={cn('flex gap-1.5', isCompact ? 'flex-col items-end' : 'flex-col')}>
				{isWaiting && (
					<span
						role="status"
						className={cn(
							'bg-yellow-100 text-yellow-900',
							isCompact ? 'rounded-full px-2 py-0.5 text-[11px]' : 'rounded-md px-3 py-1.5 text-xs',
						)}
					>
						{isCompact ? '대기중' : '참가 신청 승인 대기 중입니다.'}
					</span>
				)}
				<Button
					variant="secondary"
					disabled={isBusy}
					onClick={confirmCancel}
					aria-label={`${schedule.title ?? '일정'} 참가 취소`}
					className={cn('text-red-700 ring-red-200', sizeClass)}
				>
					{isBusy ? '처리 중…' : '참가 취소'}
				</Button>
			</span>
		);
	}

	const isRejected = schedule.myAttendanceStatus === ATTENDANCE_STATUS.REJECTED;
	const label = isRejected ? '참가 재신청' : '참가 신청';
	return (
		<Button
			variant={isRejected ? 'danger' : 'primary'}
			disabled={isBusy}
			aria-label={`${schedule.title ?? '일정'} ${label}`}
			onClick={() =>
				attend(schedule.id, {
					onSuccess: () => !isCompact && openModal({ type: ModalType.ALERT, message: '참가 신청이 완료되었습니다.' }),
				})
			}
			className={sizeClass}
		>
			{isBusy ? '처리 중…' : label}
		</Button>
	);
};

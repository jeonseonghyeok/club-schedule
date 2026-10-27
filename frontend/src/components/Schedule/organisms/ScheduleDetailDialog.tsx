import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/common/atoms/Button';
import { Dialog } from '@/components/common/organisms/Dialog';
import { InfoLine } from '@/components/Schedule/atoms/InfoLine';
import { ScheduleStatusBadge } from '@/components/Schedule/atoms/ScheduleStatusBadge';
import { AttendanceButton } from '@/components/Schedule/molecules/AttendanceButton';
import { RosterPopover } from '@/components/Schedule/molecules/RosterPopover';
import type { GroupViewer } from '@/types/GroupDetail';
import { SCHEDULE_STATUS } from '@/types/Schedule';
import type { Schedule, ScheduleAction } from '@/types/Schedule';
import { formatDateTime } from '@/utils/date';
import { canEditSchedule, canManageAttendees, formatCapacity, getScheduleTitle } from '@/utils/schedule';

interface Props {
	groupId: number;
	schedule: Schedule;
	viewer: GroupViewer;
	/** 날짜 목록에서 들어왔으면 "← 목록" 으로 돌아간다 */
	onBack: (() => void) | null;
	onChangeStatus: (action: ScheduleAction) => void;
	onEdit: () => void;
	onDuplicate: () => void;
	onManageAttendees: () => void;
	onClose: () => void;
}

const STATUS_REASON_LABEL: Partial<Record<Schedule['status'], string>> = {
	[SCHEDULE_STATUS.REJECTED]: '거부 사유',
	[SCHEDULE_STATUS.CANCELLED]: '취소 사유',
};

interface MenuItem {
	readonly label: string;
	readonly onSelect: () => void;
}

interface OptionsMenuProps {
	items: readonly MenuItem[];
}

/** ⋯ 옵션 메뉴(수정·취소) */
const OptionsMenu = (props: OptionsMenuProps) => {
	const [isOpen, setIsOpen] = useState(false);
	const containerRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (!isOpen) return;
		const closeOnOutside = (event: MouseEvent) => {
			if (event.target instanceof Node && !containerRef.current?.contains(event.target)) setIsOpen(false);
		};
		document.addEventListener('mousedown', closeOnOutside);
		return () => document.removeEventListener('mousedown', closeOnOutside);
	}, [isOpen]);

	return (
		<div ref={containerRef} className="relative">
			<Button
				variant="secondary"
				aria-label="옵션"
				aria-haspopup="menu"
				aria-expanded={isOpen}
				onClick={() => setIsOpen(open => !open)}
				className="px-3"
			>
				⋯
			</Button>
			{isOpen && (
				<ul
					role="menu"
					className="absolute right-0 bottom-full z-20 mb-1 min-w-24 rounded-lg bg-white py-1 shadow-lg ring-1 ring-gray-200"
				>
					{props.items.map(item => (
						<li key={item.label} role="none">
							<button
								type="button"
								role="menuitem"
								onClick={() => {
									setIsOpen(false);
									item.onSelect();
								}}
								className="block w-full px-4 py-2 text-left text-sm hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-gray-900"
							>
								{item.label}
							</button>
						</li>
					))}
				</ul>
			)}
		</div>
	);
};

export const ScheduleDetailDialog = (props: Props) => {
	const { groupId, schedule, viewer, onBack, onChangeStatus, onEdit, onDuplicate, onManageAttendees, onClose } = props;
	const isConfirmed = schedule.status === SCHEDULE_STATUS.CONFIRMED;
	const isPending = schedule.status === SCHEDULE_STATUS.PENDING;

	const menuItems: MenuItem[] = [
		...(canEditSchedule(schedule, viewer) ? [{ label: '수정', onSelect: onEdit }] : []),
		...(viewer.canManageSchedule && isConfirmed ? [{ label: '취소', onSelect: () => onChangeStatus('cancel') }] : []),
	];

	return (
		<Dialog
			title={getScheduleTitle(schedule)}
			size="md"
			onClose={onClose}
			headerActions={
				onBack && (
					<Button variant="secondary" onClick={onBack} className="px-3 py-1">
						← 목록
					</Button>
				)
			}
		>
			<div className="flex flex-col gap-3 text-sm">
				{!isConfirmed && (
					<div className="flex flex-col gap-1">
						<div>
							<ScheduleStatusBadge status={schedule.status} />
						</div>
						{schedule.statusReason && (
							<p className="rounded-md bg-gray-50 px-3 py-2 text-gray-700">
								<span className="font-semibold">{STATUS_REASON_LABEL[schedule.status] ?? '사유'}</span>{' '}
								{schedule.statusReason}
							</p>
						)}
					</div>
				)}
				<div className="grid gap-1 sm:grid-cols-2">
					<InfoLine label="시작시간">{formatDateTime(new Date(schedule.start).toISOString())}</InfoLine>
					{schedule.end && <InfoLine label="종료시간">{formatDateTime(new Date(schedule.end).toISOString())}</InfoLine>}
				</div>
				<InfoLine label="모임장소">{schedule.locationName || '-'}</InfoLine>
				<div className="flex items-center gap-2 text-xs">
					<span className="w-14 shrink-0 text-gray-400">참가인원</span>
					{isConfirmed && viewer.isMember ? (
						<RosterPopover
							groupId={groupId}
							scheduleId={schedule.id}
							confirmedCount={schedule.confirmedCount}
							maxAttendance={schedule.maxAttendance}
						/>
					) : (
						<span className="text-gray-700">{formatCapacity(schedule.confirmedCount, schedule.maxAttendance)}</span>
					)}
					{isConfirmed && canManageAttendees(schedule, viewer) && (
						<button
							type="button"
							onClick={onManageAttendees}
							className="ml-auto text-sm font-bold text-red-700 hover:underline focus-visible:outline-2 focus-visible:outline-gray-900"
						>
							참가자 관리
						</button>
					)}
				</div>
				{isConfirmed && viewer.isMember && <AttendanceButton groupId={groupId} schedule={schedule} size="full" />}
				{schedule.description && (
					<div>
						<p className="mb-1 text-xs text-gray-400">내용</p>
						<p className="rounded-md bg-gray-50 p-3 whitespace-pre-wrap text-gray-800 ring-1 ring-gray-200">
							{schedule.description}
						</p>
					</div>
				)}
				{(isPending && viewer.canManageSchedule) || (isConfirmed && viewer.isMember) || menuItems.length > 0 ? (
					<div className="flex flex-wrap items-center gap-2 border-t border-gray-100 pt-3">
						{isPending && viewer.canManageSchedule && (
							<>
								<Button onClick={() => onChangeStatus('approve')}>승인</Button>
								<Button variant="danger" onClick={() => onChangeStatus('reject')}>
									거부
								</Button>
							</>
						)}
						<div className="ml-auto flex gap-2">
							{isConfirmed && viewer.isMember && (
								<Button variant="secondary" onClick={onDuplicate}>
									복제
								</Button>
							)}
							{menuItems.length > 0 && <OptionsMenu items={menuItems} />}
						</div>
					</div>
				) : null}
			</div>
		</Dialog>
	);
};

import { useQuery } from '@tanstack/react-query';
import { useEffect, useId, useRef, useState } from 'react';
import { attendanceQueries } from '@/modules/stores/server/attendance/queries';
import { ATTENDANCE_STATUS } from '@/types/Schedule';
import type { RosterEntry } from '@/types/Schedule';
import { cn } from '@/utils';
import { ATTENDANCE_STATUS_LABEL, formatCapacity, STATUS_TONE_CLASS } from '@/utils/schedule';

interface Props {
	groupId: number;
	scheduleId: number;
	confirmedCount: number;
	maxAttendance: number;
}

const countConfirmed = (roster: readonly RosterEntry[]): number =>
	roster.filter(entry => entry.status === ATTENDANCE_STATUS.CONFIRMED).length;

/**
 * 참가인원 값. 마우스를 올리거나 누르면 확정·대기 명단을 보여준다.
 * 명단을 받으면 목록 조회 때의 집계 대신 명단 기준으로 인원수를 다시 계산한다(그 사이 참가/취소가 있었을 수 있다).
 */
export const RosterPopover = (props: Props) => {
	const { groupId, scheduleId, confirmedCount, maxAttendance } = props;
	const [isOpen, setIsOpen] = useState(false);
	const panelId = useId();
	const containerRef = useRef<HTMLSpanElement>(null);
	const { data: roster, isError } = useQuery({ ...attendanceQueries.roster({ groupId, scheduleId }), enabled: isOpen });
	const count = roster ? countConfirmed(roster) : confirmedCount;
	const visible = roster?.filter(
		entry => entry.status === ATTENDANCE_STATUS.CONFIRMED || entry.status === ATTENDANCE_STATUS.PENDING,
	);

	useEffect(() => {
		if (!isOpen) return;
		const closeOnOutside = (event: MouseEvent) => {
			if (event.target instanceof Node && !containerRef.current?.contains(event.target)) setIsOpen(false);
		};
		document.addEventListener('mousedown', closeOnOutside);
		return () => document.removeEventListener('mousedown', closeOnOutside);
	}, [isOpen]);

	const renderBody = () => {
		if (isError) return <p className="text-red-700">명단을 불러오지 못했습니다.</p>;
		if (!visible) return <p className="text-gray-400">불러오는 중...</p>;
		if (visible.length === 0) return <p className="text-gray-400">참가자가 없습니다.</p>;
		return (
			<ul className="flex flex-col gap-1">
				{visible.map((entry, index) => (
					<li key={`${entry.displayName}-${index}`} className="flex items-center gap-1.5">
						<span>{entry.displayName || '(알 수 없음)'}</span>
						<span className={cn('rounded-full px-1.5 text-[11px]', STATUS_TONE_CLASS[entry.status])}>
							{ATTENDANCE_STATUS_LABEL[entry.status]}
						</span>
					</li>
				))}
			</ul>
		);
	};

	return (
		<span ref={containerRef} className="relative inline-block" onMouseLeave={() => setIsOpen(false)}>
			<button
				type="button"
				aria-expanded={isOpen}
				aria-controls={panelId}
				aria-label={`참가인원 ${formatCapacity(count, maxAttendance)}, 명단 보기`}
				onMouseEnter={() => setIsOpen(true)}
				onClick={event => {
					event.stopPropagation();
					setIsOpen(open => !open);
				}}
				className="border-b border-dotted border-gray-400 focus-visible:outline-2 focus-visible:outline-gray-900"
			>
				{formatCapacity(count, maxAttendance)}
			</button>
			{isOpen && (
				<div
					id={panelId}
					role="region"
					aria-label="참가자 명단"
					className="absolute left-0 z-20 mt-1 min-w-40 rounded-lg bg-white p-2 text-xs shadow-lg ring-1 ring-gray-200"
				>
					{renderBody()}
				</div>
			)}
		</span>
	);
};

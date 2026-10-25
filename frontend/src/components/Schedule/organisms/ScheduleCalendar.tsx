import { useId, useState } from 'react';
import { Button } from '@/components/common/atoms/Button';
import { SCHEDULE_STATUS } from '@/types/Schedule';
import type { Schedule, ScheduleStatus } from '@/types/Schedule';
import { cn } from '@/utils';
import {
	buildMonthCells,
	getDominantStatus,
	groupSchedulesByDate,
	SCHEDULE_FILTER_ALL,
	startOfMonth,
	STATUS_TONE_CLASS,
	toDateKey,
} from '@/utils/schedule';
import type { ScheduleFilter } from '@/utils/schedule';

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'] as const;
const MAX_BADGE_COUNT = 99;

const FILTER_OPTIONS = [
	{ value: SCHEDULE_STATUS.CONFIRMED, label: '승인' },
	{ value: SCHEDULE_STATUS.PENDING, label: '대기' },
	{ value: SCHEDULE_STATUS.REJECTED, label: '거부' },
	{ value: SCHEDULE_STATUS.CANCELLED, label: '취소' },
	{ value: SCHEDULE_FILTER_ALL, label: '전체' },
] as const satisfies readonly { value: ScheduleFilter; label: string }[];

const isFilter = (value: string): value is ScheduleFilter => FILTER_OPTIONS.some(option => option.value === value);

const STATUS_COUNT_LABEL = {
	PENDING: '대기 포함',
	CONFIRMED: '',
	REJECTED: '거부',
	CANCELLED: '취소',
} as const satisfies Record<ScheduleStatus, string>;

interface Props {
	schedules: readonly Schedule[];
	/** 관리자만 상태 필터를 바꿀 수 있다(기본: 승인된 일정) */
	canFilter: boolean;
	canCreate: boolean;
	onSelectDay: (date: Date, schedules: readonly Schedule[]) => void;
	onCreate: () => void;
}

export const ScheduleCalendar = (props: Props) => {
	const { schedules, canFilter, canCreate, onSelectDay, onCreate } = props;
	const filterId = useId();
	const [monthStart, setMonthStart] = useState(() => startOfMonth(new Date()));
	const [filter, setFilter] = useState<ScheduleFilter>(SCHEDULE_STATUS.CONFIRMED);
	const byDate = groupSchedulesByDate(schedules, filter);
	const todayKey = toDateKey(new Date());
	const moveMonth = (offset: number) =>
		setMonthStart(prev => new Date(prev.getFullYear(), prev.getMonth() + offset, 1));

	return (
		<section aria-label="일정 달력" className="flex flex-col gap-3">
			<div className="flex flex-wrap items-center justify-between gap-2">
				{canFilter ? (
					<div className="flex items-center gap-2 text-sm">
						<label htmlFor={filterId} className="text-gray-600">
							일정 보기
						</label>
						<select
							id={filterId}
							value={filter}
							onChange={event => {
								if (isFilter(event.target.value)) setFilter(event.target.value);
							}}
							className="rounded-md border border-gray-300 px-2 py-1 focus-visible:outline-2 focus-visible:outline-gray-900"
						>
							{FILTER_OPTIONS.map(option => (
								<option key={option.value} value={option.value}>
									{option.label}
								</option>
							))}
						</select>
					</div>
				) : (
					<span />
				)}
				{canCreate && <Button onClick={onCreate}>일정등록</Button>}
			</div>
			<div className="flex items-center justify-center gap-4">
				<Button variant="secondary" aria-label="이전 달" onClick={() => moveMonth(-1)} className="px-3">
					◀
				</Button>
				<h2 aria-live="polite" className="text-lg font-bold text-gray-900">
					{monthStart.getFullYear()}년 {monthStart.getMonth() + 1}월
				</h2>
				<Button variant="secondary" aria-label="다음 달" onClick={() => moveMonth(1)} className="px-3">
					▶
				</Button>
			</div>
			<div
				role="grid"
				aria-label={`${monthStart.getFullYear()}년 ${monthStart.getMonth() + 1}월`}
				className="grid grid-cols-7 gap-1"
			>
				<div role="row" className="contents">
					{WEEKDAYS.map((weekday, index) => (
						<div
							key={weekday}
							role="columnheader"
							className={cn(
								'py-1 text-center text-xs font-semibold',
								index === 0 ? 'text-red-600' : index === 6 ? 'text-blue-600' : 'text-gray-500',
							)}
						>
							{weekday}
						</div>
					))}
				</div>
				{buildMonthCells(monthStart).map(date => {
					const key = toDateKey(date);
					const daySchedules = byDate.get(key) ?? [];
					const isOutside = date.getMonth() !== monthStart.getMonth();
					const dominant = daySchedules.length > 0 ? getDominantStatus(daySchedules) : null;
					const countText = daySchedules.length > MAX_BADGE_COUNT ? `${MAX_BADGE_COUNT}+` : String(daySchedules.length);
					return (
						<button
							key={key}
							type="button"
							role="gridcell"
							aria-label={`${date.getMonth() + 1}월 ${date.getDate()}일${key === todayKey ? ' 오늘' : ''}, 일정 ${daySchedules.length}건${dominant ? ` ${STATUS_COUNT_LABEL[dominant]}` : ''}`}
							onClick={() => onSelectDay(date, daySchedules)}
							className={cn(
								'flex min-h-16 flex-col items-center gap-1 rounded-md border border-gray-100 p-1 hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-gray-900',
								isOutside && 'text-gray-300',
							)}
						>
							<span
								className={cn(
									'flex size-6 items-center justify-center rounded-full text-sm',
									key === todayKey && 'bg-blue-600 font-bold text-white',
								)}
							>
								{date.getDate()}
							</span>
							{dominant && (
								<span
									aria-hidden="true"
									className={cn('rounded-full px-1.5 text-[11px] font-semibold', STATUS_TONE_CLASS[dominant])}
								>
									{countText}건
								</span>
							)}
						</button>
					);
				})}
			</div>
		</section>
	);
};

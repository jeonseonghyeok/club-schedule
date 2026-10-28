import { Link } from '@tanstack/react-router';
import { EmptyMessage } from '@/components/common/atoms/EmptyMessage';
import { Icon } from '@/components/common/atoms/Icon';
import type { MapGroup, MapSchedule } from '@/types/Map';
import { cn } from '@/utils';
import { formatDateTime } from '@/utils/date';
import { getGroupName } from '@/utils/group';

const ITEM_CLASS =
	'flex items-start gap-3 rounded-xl px-3 py-3 ring-1 transition-colors focus-within:outline-2 focus-within:outline-brand-600';

interface GroupListProps {
	groups: readonly MapGroup[];
	selectedId: string | null;
	onSelect: (id: string) => void;
}

export const groupMarkerId = (group: Pick<MapGroup, 'groupId'>): string => `group-${group.groupId}`;
export const scheduleMarkerId = (schedule: Pick<MapSchedule, 'scheduleId'>): string =>
	`schedule-${schedule.scheduleId}`;

/** 지도 아래 모임 목록 — 항목을 누르면 지도에서 그 위치로, 이름은 모임 화면 링크 */
export const MapGroupList = (props: GroupListProps) => {
	const { groups, selectedId, onSelect } = props;
	if (groups.length === 0) {
		return (
			<EmptyMessage message="활동 지역을 등록한 모임이 아직 없습니다. 모임 관리 › 설정에서 활동 지역을 정할 수 있습니다." />
		);
	}
	return (
		<ul className="flex flex-col gap-2">
			{groups.map(group => {
				const id = groupMarkerId(group);
				const isSelected = id === selectedId;
				return (
					<li key={id} className={cn(ITEM_CLASS, isSelected ? 'bg-brand-50 ring-brand-300' : 'bg-white ring-gray-200')}>
						<button
							type="button"
							aria-label={`${getGroupName(group)} 위치 보기`}
							aria-pressed={isSelected}
							onClick={() => onSelect(id)}
							className="mt-0.5 shrink-0 text-brand-700 focus-visible:outline-none"
						>
							<Icon name="pin" />
						</button>
						<div className="min-w-0 flex-1">
							<Link
								to="/groups/$groupId"
								params={{ groupId: String(group.groupId) }}
								search={{ tab: 'home' }}
								className="font-semibold text-gray-900 hover:underline focus-visible:outline-none"
							>
								{getGroupName(group)}
							</Link>
							<p className="truncate text-sm text-gray-500">
								{group.regionName} · 멤버 {group.memberCount}명
							</p>
						</div>
						{group.isMember && (
							<span className="shrink-0 rounded-full bg-brand-100 px-2 py-0.5 text-[11px] font-bold text-brand-800">
								가입함
							</span>
						)}
					</li>
				);
			})}
		</ul>
	);
};

interface ScheduleListProps {
	schedules: readonly MapSchedule[];
	selectedId: string | null;
	onSelect: (id: string) => void;
}

export const MapScheduleList = (props: ScheduleListProps) => {
	const { schedules, selectedId, onSelect } = props;
	if (schedules.length === 0) {
		return (
			<EmptyMessage message="장소가 지정된 다가오는 일정이 없습니다. 일정을 만들 때 장소를 검색해 고르면 지도에 표시됩니다." />
		);
	}
	return (
		<ul className="flex flex-col gap-2">
			{schedules.map(schedule => {
				const id = scheduleMarkerId(schedule);
				const isSelected = id === selectedId;
				return (
					<li key={id} className={cn(ITEM_CLASS, isSelected ? 'bg-brand-50 ring-brand-300' : 'bg-white ring-gray-200')}>
						<button
							type="button"
							aria-label={`${schedule.title ?? '일정'} 위치 보기`}
							aria-pressed={isSelected}
							onClick={() => onSelect(id)}
							className="mt-0.5 shrink-0 text-brand-700 focus-visible:outline-none"
						>
							<Icon name="pin" />
						</button>
						<div className="min-w-0 flex-1">
							<Link
								to="/groups/$groupId"
								params={{ groupId: String(schedule.groupId) }}
								search={{ tab: 'schedule' }}
								className="font-semibold text-gray-900 hover:underline focus-visible:outline-none"
							>
								{schedule.title || '제목 없음'}
							</Link>
							<p className="truncate text-sm text-gray-500">
								{formatDateTime(new Date(schedule.start).toISOString())} · {getGroupName({ name: schedule.groupName })}
							</p>
							<p className="truncate text-sm text-gray-700">{schedule.locationName}</p>
						</div>
					</li>
				);
			})}
		</ul>
	);
};

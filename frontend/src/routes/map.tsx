import { useQuery, useSuspenseQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { z } from 'zod';
import { LoginCard } from '@/components/Auth/organisms/LoginCard';
import { EmptyMessage } from '@/components/common/atoms/EmptyMessage';
import { AppShell } from '@/components/layout/AppShell';
import { KakaoMap } from '@/components/Map/organisms/KakaoMap';
import {
	groupMarkerId,
	MapGroupList,
	MapScheduleList,
	scheduleMarkerId,
} from '@/components/Map/organisms/MapPlaceList';
import { KAKAO_MAPS_STATUS, useKakaoMaps } from '@/hooks/useKakaoMaps';
import { authQueries } from '@/modules/stores/server/auth/queries';
import { mapQueries } from '@/modules/stores/server/map/queries';
import { MAP_VIEW } from '@/types/Map';
import type { MapMarker, MapView } from '@/types/Map';
import { cn } from '@/utils';
import { getGroupName } from '@/utils/group';

const MAP_VIEW_KEYS = [MAP_VIEW.GROUPS, MAP_VIEW.SCHEDULES] as const;

const mapSearchSchema = z.object({
	view: z.enum(MAP_VIEW_KEYS).optional().catch(undefined),
});

const VIEW_LABEL = { groups: '모임 활동 지역', schedules: '일정 장소' } as const satisfies Record<MapView, string>;

/** 지도 자리: SDK 상태에 따라 지도 / 준비 중 / 안내 */
interface MapAreaProps {
	markers: readonly MapMarker[];
	selectedId: string | null;
	onSelect: (id: string) => void;
}

const MapArea = (props: MapAreaProps) => {
	const status = useKakaoMaps();
	switch (status) {
		case KAKAO_MAPS_STATUS.READY:
			return (
				<div className="h-[45dvh] min-h-64 overflow-hidden rounded-2xl ring-1 ring-gray-200 md:h-[28rem]">
					<KakaoMap {...props} label="지도" />
				</div>
			);
		case KAKAO_MAPS_STATUS.LOADING:
			return (
				<div className="h-[45dvh] min-h-64 animate-pulse rounded-2xl bg-gray-100 md:h-[28rem]" aria-hidden="true" />
			);
		case KAKAO_MAPS_STATUS.UNAVAILABLE:
		case KAKAO_MAPS_STATUS.ERROR:
			return (
				<p className="rounded-2xl bg-white px-4 py-3 text-sm text-gray-600 ring-1 ring-gray-200">
					지도를 불러올 수 없어 목록으로 보여드립니다.
				</p>
			);
		default: {
			const exhaustive: never = status;
			return exhaustive;
		}
	}
};

const MapPage = () => {
	const { data: me } = useSuspenseQuery({ ...authQueries.me() });
	const { view = MAP_VIEW.GROUPS } = Route.useSearch();
	const navigate = Route.useNavigate();
	const [selectedId, setSelectedId] = useState<string | null>(null);
	const groupsQuery = useQuery({ ...mapQueries.groups(), enabled: view === MAP_VIEW.GROUPS });
	// 일정 장소는 내 모임 일정이라 로그인해야 본다
	const schedulesQuery = useQuery({ ...mapQueries.schedules(), enabled: view === MAP_VIEW.SCHEDULES && !!me });

	const markers: MapMarker[] =
		view === MAP_VIEW.GROUPS
			? (groupsQuery.data ?? []).map(group => ({
					id: groupMarkerId(group),
					latitude: group.latitude,
					longitude: group.longitude,
					title: getGroupName(group),
				}))
			: (schedulesQuery.data ?? []).map(schedule => ({
					id: scheduleMarkerId(schedule),
					latitude: schedule.latitude,
					longitude: schedule.longitude,
					title: schedule.title ?? '일정',
				}));

	const renderList = () => {
		if (view === MAP_VIEW.SCHEDULES && !me) {
			return (
				<LoginCard title="내 모임 일정 장소" message="로그인하면 가입한 모임의 일정 장소를 지도에서 볼 수 있어요." />
			);
		}
		const query = view === MAP_VIEW.GROUPS ? groupsQuery : schedulesQuery;
		if (query.isError) return <EmptyMessage message="목록을 불러오지 못했습니다." />;
		if (!query.data) return <EmptyMessage message="로딩 중..." />;
		return view === MAP_VIEW.GROUPS ? (
			<MapGroupList groups={groupsQuery.data ?? []} selectedId={selectedId} onSelect={setSelectedId} />
		) : (
			<MapScheduleList schedules={schedulesQuery.data ?? []} selectedId={selectedId} onSelect={setSelectedId} />
		);
	};

	return (
		<AppShell title="지도" isLoggedIn={!!me}>
			<div role="group" aria-label="지도 기준" className="flex gap-1 rounded-xl bg-gray-100 p-1">
				{MAP_VIEW_KEYS.map(key => (
					<button
						key={key}
						type="button"
						aria-pressed={key === view}
						onClick={() => {
							setSelectedId(null);
							void navigate({ search: { view: key }, replace: true });
						}}
						className={cn(
							'min-h-9 flex-1 rounded-lg text-sm transition-colors focus-visible:outline-2 focus-visible:outline-brand-600',
							key === view ? 'bg-white font-semibold text-gray-900 shadow-sm' : 'font-medium text-gray-500',
						)}
					>
						{VIEW_LABEL[key]}
					</button>
				))}
			</div>
			<MapArea markers={markers} selectedId={selectedId} onSelect={setSelectedId} />
			{view === MAP_VIEW.SCHEDULES && (
				<p className="px-1 text-xs text-gray-500">
					내 모임의 확정된 일정 중 앞으로 90일 이내, 장소가 지정된 일정입니다.
				</p>
			)}
			{renderList()}
		</AppShell>
	);
};

// 모임 활동 지역은 비회원도 본다
export const Route = createFileRoute('/map')({
	validateSearch: mapSearchSchema,
	loader: ({ context }) => context.queryClient.ensureQueryData(authQueries.me()),
	component: MapPage,
});

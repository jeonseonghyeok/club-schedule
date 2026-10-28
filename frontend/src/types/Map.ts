/** GET /api/map/groups — 활동 지역 좌표가 있는 모임 */
export interface MapGroup {
	readonly groupId: number;
	readonly name: string | null;
	readonly regionName: string | null;
	readonly latitude: number;
	readonly longitude: number;
	readonly memberCount: number;
	readonly isMember: boolean;
}

/** GET /api/map/schedules — 내 모임의 장소 좌표가 있는 확정 일정 */
export interface MapSchedule {
	readonly scheduleId: number;
	readonly groupId: number;
	readonly groupName: string | null;
	readonly title: string | null;
	/** epoch ms */
	readonly start: number;
	readonly locationName: string | null;
	readonly latitude: number;
	readonly longitude: number;
}

export const MAP_VIEW = { GROUPS: 'groups', SCHEDULES: 'schedules' } as const;
export type MapView = (typeof MAP_VIEW)[keyof typeof MAP_VIEW];

/** 지도에 찍을 점 — 모임·일정 공통 */
export interface MapMarker {
	readonly id: string;
	readonly latitude: number;
	readonly longitude: number;
	readonly title: string;
}

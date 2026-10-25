import type { AdminGroup } from '@/types/Admin';

/** 비회원에게 일정을 얼마나 보여주는지 */
export const VISIBILITY_TYPE = { PUBLIC: 'PUBLIC', PARTIAL: 'PARTIAL', PRIVATE: 'PRIVATE' } as const;
export type VisibilityType = (typeof VISIBILITY_TYPE)[keyof typeof VISIBILITY_TYPE];

/** 현재 사용자 기준 권한·상태 */
export interface GroupViewer {
	readonly userKey: number | null;
	readonly isLeader: boolean;
	readonly isManager: boolean;
	readonly isMember: boolean;
	readonly canCreateSchedule: boolean;
	/** 일정 등록 후 관리자 승인이 필요한지 */
	readonly createNeedsApproval: boolean;
	readonly canManageSchedule: boolean;
	readonly isFavoriteGroup: boolean;
	readonly hasFavoriteGroup: boolean;
}

/** GET /api/groups/{groupId} */
export interface GroupDetail {
	readonly group: AdminGroup;
	readonly visibilityType: VisibilityType;
	readonly viewer: GroupViewer;
}

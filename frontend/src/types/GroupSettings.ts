import type { VisibilityType } from '@/types/GroupDetail';
import type { GroupRole } from '@/types/Member';

/** group_schedule_policy — 일정·참가 권한 판단에 실제로 쓰이는 모임 정책 */
export interface GroupPolicy {
	/** MEMBER 면 모든 회원이 일정을 등록할 수 있다. LEADER·MANAGER 는 일반회원 등록 불가로 같다 */
	readonly minRoleToCreate: GroupRole;
	/** 일반회원이 등록한 일정은 승인 후 확정 */
	readonly requiresApproval: boolean;
	/** 개별 권한을 주지 않은 매니저도 일정 승인·반려·수정·취소, 참가 승인·참석 체크를 할 수 있다 */
	readonly defManagerCanManageSchedule: boolean;
	/** 일반회원의 참가 신청은 승인 후 확정 */
	readonly requiresAttendanceApproval: boolean;
	readonly visibilityType: VisibilityType;
}

/** GET /api/groups/{groupId}/settings — 리더·매니저 전용 */
export interface GroupSettings {
	readonly groupId: number;
	readonly name: string;
	readonly description: string | null;
	readonly capacity: number;
	/** 켜면 가입 신청이 정원 안에서 바로 승인된다 */
	readonly autoApprove: boolean;
	/** 회원이 모임 닉네임을 직접 바꿀 수 있다(꺼도 리더는 바꿀 수 있다) */
	readonly allowSelfNickname: boolean;
	/** 대표 활동 지역 — 좌표가 있으면 지도 탭에 표시된다 */
	readonly regionName: string | null;
	readonly latitude: number | null;
	readonly longitude: number | null;
	readonly appEnabled: boolean;
	readonly appName: string | null;
	readonly appThemeColor: string | null;
	readonly activeMemberCount: number;
	readonly policy: GroupPolicy;
}

/** PATCH /api/groups/{groupId} */
export interface GroupInfoPayload {
	readonly name: string;
	readonly description: string;
	readonly capacity: number;
	readonly autoApprove: boolean;
	readonly allowSelfNickname: boolean;
}

/** PUT /api/groups/{groupId}/region — 이름이 비고 좌표가 없으면 해제 */
export interface GroupRegionPayload {
	readonly regionName: string | null;
	readonly latitude: number | null;
	readonly longitude: number | null;
}

/** PUT /api/groups/{groupId}/app — 리더·매니저, 전용 앱이 켜진 모임만 */
export interface GroupAppBrandingPayload {
	readonly appName: string | null;
	readonly themeColor: string;
	/** 512px PNG base64(화면이 그린 아이콘) */
	readonly iconPng: string;
}

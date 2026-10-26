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
	readonly activeMemberCount: number;
	readonly policy: GroupPolicy;
}

/** PATCH /api/groups/{groupId} */
export interface GroupInfoPayload {
	readonly name: string;
	readonly description: string;
	readonly capacity: number;
	readonly autoApprove: boolean;
}

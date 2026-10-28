import type { Group } from '@/types/Group';
import type { GroupRequest } from '@/types/GroupRequest';

export const SYSTEM_ROLE = { USER: 'USER', ADMIN: 'ADMIN' } as const;
export type SystemRole = (typeof SYSTEM_ROLE)[keyof typeof SYSTEM_ROLE];

export interface AdminUser {
	readonly userKey: number;
	readonly kakaoApiId: number | null;
	readonly nickname: string | null;
	readonly createdAt: string | null;
	readonly systemRole: SystemRole | null;
}

export interface AdminGroup extends Group {
	readonly autoApprove: boolean | null;
	/** 회원 본인의 모임 닉네임 수정 허용 */
	readonly allowSelfNickname: boolean | null;
	/** 대표 활동 지역(없으면 null) */
	readonly regionName: string | null;
	/** 모임 전용 앱(/g/{groupId}/) 제공 여부 — 시스템 관리자가 켠다 */
	readonly appEnabled: boolean | null;
	/** 전용 앱 이름(null 이면 모임 이름) */
	readonly appName: string | null;
	/** 전용 앱 대표 색 #rrggbb(null 이면 모요라 색) */
	readonly appThemeColor: string | null;
	readonly schedulePolicy: string | null;
	readonly groupRequestId: number | null;
	readonly createdAt: string | null;
}

/** 관리자 화면의 모임 생성 신청 — 요청자·처리자 정보가 더 있다 */
export interface AdminGroupRequest extends GroupRequest {
	readonly userKey: number;
	readonly updatedBy: number | null;
}

export const JOIN_REQUEST_STATUS = { PENDING: 'PENDING', APPROVED: 'APPROVED', REJECTED: 'REJECTED' } as const;
export type JoinRequestStatus = (typeof JOIN_REQUEST_STATUS)[keyof typeof JOIN_REQUEST_STATUS];

export interface AdminGroupJoin {
	readonly requestId: number;
	readonly groupId: number;
	readonly groupName: string | null;
	readonly userKey: number;
	readonly nickname: string | null;
	readonly status: JoinRequestStatus;
	readonly requestedAt: string | null;
}

/** 관리자 목록 공통 검색 조건 — 빈 문자열이면 조건 없음 */
export interface AdminSearchCriteria {
	/** 회원: 닉네임·가입 경로, 그룹: 그룹명, 그룹 신청: 모임명, 가입 요청: 닉네임·그룹명 */
	readonly q: string;
	/** yyyy-MM-dd — 회원 가입일·그룹 생성일·신청일 범위(양 끝 포함) */
	readonly from: string;
	readonly to: string;
}

export interface AdminListParams extends AdminSearchCriteria {
	readonly page: number;
}

export interface AdminUserListParams extends AdminListParams {
	/** 빈 문자열이면 전체 */
	readonly role: SystemRole | '';
}

export interface AdminGroupRequestListParams extends AdminListParams {
	/** 빈 문자열이면 전체 이력 */
	readonly status: GroupRequest['status'] | '';
}

/** POST /api/admin/group-requests/{id}/approve 응답 */
export interface GroupRequestApproval {
	readonly groupId: number;
}

export interface RejectionParams {
	readonly requestId: number;
	/** 그룹 신청 거부는 필수, 가입 요청 거부는 선택(빈 문자열 → null) */
	readonly rejectReason: string;
}

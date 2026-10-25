import type { GroupRequestStatus } from '@/types/GroupRequest';

/** 관리자 화면 상태 라벨(사용자 화면의 "승인대기/승인처리…"와 다르다) */
export const ADMIN_STATUS_LABEL = {
	PENDING: '대기',
	APPROVED: '승인',
	REJECTED: '거부',
	CANCELLED: '취소',
} as const satisfies Record<GroupRequestStatus, string>;

export const formatOptional = (value: string | number | boolean | null | undefined): string => {
	if (value === null || value === undefined || value === '') return '-';
	if (typeof value === 'boolean') return value ? '예' : '아니오';
	return String(value);
};

/** 그룹 신청 거부 사유 선택지 — 마지막 "기타"는 직접 입력 */
export const GROUP_REQUEST_REJECT_PRESETS = ['모임명 부적절', '모임 설명 부족', '중복 모임', '운영 정책 위반'] as const;

export const NOTIFICATION_CATEGORY = { APPROVE: 'APPROVE', REJECT: 'REJECT', NOTICE: 'NOTICE' } as const;
export type NotificationCategory = (typeof NOTIFICATION_CATEGORY)[keyof typeof NOTIFICATION_CATEGORY];

export const NOTIFICATION_SOURCE = {
	GROUP_CREATE_REQUEST: 'GROUP_CREATE_REQUEST',
	GROUP_JOIN_REQUEST: 'GROUP_JOIN_REQUEST',
	SCHEDULE: 'SCHEDULE',
} as const;
export type NotificationSource = (typeof NOTIFICATION_SOURCE)[keyof typeof NOTIFICATION_SOURCE];

export interface Notification {
	readonly notificationId: number;
	readonly sourceTable: NotificationSource;
	readonly category: NotificationCategory;
	readonly title: string | null;
	readonly content: string | null;
	readonly isRead: boolean;
	/** ISO-8601 Instant */
	readonly createdAt: string | null;
	readonly groupId: number | null;
	/** 클릭 시 이동할 화면 경로 (예: /groups/3) */
	readonly targetUrl: string | null;
}

export interface UnreadCount {
	readonly count: number;
}

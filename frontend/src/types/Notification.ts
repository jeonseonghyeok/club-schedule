export const NOTIFICATION_CATEGORY = { APPROVE: 'APPROVE', REJECT: 'REJECT', NOTICE: 'NOTICE' } as const;
export type NotificationCategory = (typeof NOTIFICATION_CATEGORY)[keyof typeof NOTIFICATION_CATEGORY];

export interface Notification {
	readonly notificationId: number;
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

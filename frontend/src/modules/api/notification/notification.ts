import type { Notification, UnreadCount } from '@/types/Notification';
import { notificationApi } from '.';

/** groupId 가 있으면 그 모임 알림만(모임 전용 앱) */
const scopeQuery = (groupId: number | null): string => (groupId === null ? '' : `groupId=${groupId}`);

export const getNotifications = async (params: { limit: number; groupId: number | null }): Promise<Notification[]> => {
	const query = [`limit=${params.limit}`, scopeQuery(params.groupId)].filter(Boolean).join('&');
	const { data } = await notificationApi.get<Notification[]>(`/api/notifications?${query}`);
	return data;
};

export const getUnreadNotificationCount = async (groupId: number | null): Promise<UnreadCount> => {
	const query = scopeQuery(groupId);
	const { data } = await notificationApi.get<UnreadCount>(`/api/notifications/unread-count${query ? `?${query}` : ''}`);
	return data;
};

export const updateNotificationRead = async (notificationId: number): Promise<void> => {
	await notificationApi.patch(`/api/notifications/${notificationId}/read`);
};

export const updateAllNotificationsRead = async (groupId: number | null): Promise<void> => {
	const query = scopeQuery(groupId);
	await notificationApi.patch(`/api/notifications/read-all${query ? `?${query}` : ''}`);
};

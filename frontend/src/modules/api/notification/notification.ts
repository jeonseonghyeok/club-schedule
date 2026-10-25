import type { Notification, UnreadCount } from '@/types/Notification';
import { notificationApi } from '.';

export const getNotifications = async (limit: number): Promise<Notification[]> => {
	const { data } = await notificationApi.get<Notification[]>(`/api/notifications?limit=${limit}`);
	return data;
};

export const getUnreadNotificationCount = async (): Promise<UnreadCount> => {
	const { data } = await notificationApi.get<UnreadCount>('/api/notifications/unread-count');
	return data;
};

export const updateNotificationRead = async (notificationId: number): Promise<void> => {
	await notificationApi.patch(`/api/notifications/${notificationId}/read`);
};

export const updateAllNotificationsRead = async (): Promise<void> => {
	await notificationApi.patch('/api/notifications/read-all');
};

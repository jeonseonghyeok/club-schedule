import { queryOptions } from '@tanstack/react-query';
import { getNotifications, getUnreadNotificationCount } from '@/modules/api/notification/notification';

const RECENT_NOTIFICATION_LIMIT = 20;

/** groupId: null 이면 내 모든 알림(모요라), 있으면 그 모임 알림(모임 전용 앱) */
export const notificationQueries = {
	all: () => ['notifications'],
	recentAll: () => [...notificationQueries.all(), 'recent'],
	unreadCountAll: () => [...notificationQueries.all(), 'unreadCount'],
	recent: (groupId: number | null) =>
		queryOptions({
			queryKey: [...notificationQueries.recentAll(), groupId],
			queryFn: () => getNotifications({ limit: RECENT_NOTIFICATION_LIMIT, groupId }),
		}),
	unreadCount: (groupId: number | null) =>
		queryOptions({
			queryKey: [...notificationQueries.unreadCountAll(), groupId],
			queryFn: () => getUnreadNotificationCount(groupId),
		}),
};

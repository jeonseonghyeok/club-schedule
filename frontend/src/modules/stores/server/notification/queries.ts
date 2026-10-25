import { queryOptions } from '@tanstack/react-query';
import { getNotifications, getUnreadNotificationCount } from '@/modules/api/notification/notification';

const RECENT_NOTIFICATION_LIMIT = 20;

export const notificationQueries = {
	all: () => ['notifications'],
	recent: () =>
		queryOptions({
			queryKey: [...notificationQueries.all(), 'recent'],
			queryFn: () => getNotifications(RECENT_NOTIFICATION_LIMIT),
		}),
	unreadCount: () =>
		queryOptions({
			queryKey: [...notificationQueries.all(), 'unreadCount'],
			queryFn: getUnreadNotificationCount,
		}),
};

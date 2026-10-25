import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateAllNotificationsRead, updateNotificationRead } from '@/modules/api/notification/notification';
import { notificationQueries } from './queries';

// 알림 읽음 처리 실패는 사용자 흐름을 막지 않으므로(이동은 계속된다) 모달을 띄우지 않는다.

export const useReadNotification = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (notificationId: number) => updateNotificationRead(notificationId),
		onSuccess: (_, notificationId) => {
			queryClient.setQueryData(notificationQueries.recent().queryKey, prev =>
				prev?.map(item => (item.notificationId === notificationId ? { ...item, isRead: true } : item)),
			);
			queryClient.setQueryData(notificationQueries.unreadCount().queryKey, prev =>
				prev ? { count: Math.max(0, prev.count - 1) } : prev,
			);
		},
	});
};

export const useReadAllNotifications = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: updateAllNotificationsRead,
		onSuccess: () => {
			queryClient.setQueryData(notificationQueries.recent().queryKey, prev =>
				prev?.map(item => ({ ...item, isRead: true })),
			);
			queryClient.setQueryData(notificationQueries.unreadCount().queryKey, { count: 0 });
		},
	});
};

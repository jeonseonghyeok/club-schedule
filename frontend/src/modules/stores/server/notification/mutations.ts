import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { QueryClient } from '@tanstack/react-query';
import { updateAllNotificationsRead, updateNotificationRead } from '@/modules/api/notification/notification';
import type { Notification, UnreadCount } from '@/types/Notification';
import { notificationQueries } from './queries';

// 알림 읽음 처리 실패는 사용자 흐름을 막지 않으므로(이동은 계속된다) 모달을 띄우지 않는다.
// 같은 알림이 전체(모요라) 목록과 모임(전용 앱) 목록에 함께 있을 수 있어 두 범위를 같이 고친다.

const decreaseUnread = (queryClient: QueryClient, groupId: number | null) =>
	queryClient.setQueryData<UnreadCount>(notificationQueries.unreadCount(groupId).queryKey, prev =>
		prev ? { count: Math.max(0, prev.count - 1) } : prev,
	);

export const useReadNotification = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (notification: Notification) => updateNotificationRead(notification.notificationId),
		onSuccess: (_, notification) => {
			queryClient.setQueriesData<Notification[]>({ queryKey: notificationQueries.recentAll() }, prev =>
				prev?.map(item => (item.notificationId === notification.notificationId ? { ...item, isRead: true } : item)),
			);
			decreaseUnread(queryClient, null);
			if (notification.groupId !== null) decreaseUnread(queryClient, notification.groupId);
		},
	});
};

export const useReadAllNotifications = (groupId: number | null) => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: () => updateAllNotificationsRead(groupId),
		onSuccess: () => {
			queryClient.setQueryData(notificationQueries.recent(groupId).queryKey, prev =>
				prev?.map(item => ({ ...item, isRead: true })),
			);
			queryClient.setQueryData(notificationQueries.unreadCount(groupId).queryKey, { count: 0 });
			// 다른 범위(전체 ↔ 모임)의 목록·개수는 서버 기준으로 다시 받는다
			void queryClient.invalidateQueries({
				queryKey: notificationQueries.all(),
				predicate: query => query.queryKey[2] !== groupId,
			});
		},
	});
};

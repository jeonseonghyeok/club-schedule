import { useQuery } from '@tanstack/react-query';
import { useRouter } from '@tanstack/react-router';
import { useEffect, useId, useRef, useState } from 'react';
import { EmptyMessage } from '@/components/common/atoms/EmptyMessage';
import { Icon } from '@/components/common/atoms/Icon';
import { useReadAllNotifications, useReadNotification } from '@/modules/stores/server/notification/mutations';
import { notificationQueries } from '@/modules/stores/server/notification/queries';
import { NOTIFICATION_SOURCE } from '@/types/Notification';
import type { Notification, NotificationCategory } from '@/types/Notification';
import { cn } from '@/utils';
import { getGroupAppPath } from '@/utils/appIcon';
import { formatDateTime } from '@/utils/date';

const CATEGORY_ICON = { APPROVE: '✅', REJECT: '❌', NOTICE: '📢' } as const satisfies Record<
	NotificationCategory,
	string
>;
const MAX_BADGE_COUNT = 99;

const FILTER = { ALL: 'ALL', UNREAD: 'UNREAD' } as const;
type Filter = (typeof FILTER)[keyof typeof FILTER];
const FILTER_LABEL = { ALL: '전체', UNREAD: '읽지 않음' } as const satisfies Record<Filter, string>;

const formatBadgeCount = (count: number): string => (count > MAX_BADGE_COUNT ? `${MAX_BADGE_COUNT}+` : String(count));

interface ItemProps {
	notification: Notification;
	onSelect: (notification: Notification) => void;
}

const NotificationItem = (props: ItemProps) => {
	const { notification, onSelect } = props;
	return (
		<li>
			<button
				type="button"
				onClick={() => onSelect(notification)}
				className={cn(
					'flex w-full gap-2 rounded-lg px-2 py-2 text-left hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-gray-900',
					!notification.isRead && 'bg-brand-50',
				)}
			>
				<span aria-hidden="true" className="shrink-0">
					{CATEGORY_ICON[notification.category] ?? CATEGORY_ICON.NOTICE}
				</span>
				<span className="min-w-0 flex-1">
					<span className={cn('block text-sm text-gray-900', notification.isRead ? 'font-medium' : 'font-bold')}>
						{!notification.isRead && <span className="sr-only">읽지 않음: </span>}
						{notification.title}
					</span>
					<span className="block truncate text-xs text-gray-500">{notification.content}</span>
					<span className="block text-xs text-gray-400">{formatDateTime(notification.createdAt, '')}</span>
				</span>
			</button>
		</li>
	);
};

/**
 * 알림을 누르면 갈 화면. 모임 전용 앱 안에서는 그 모임 알림을 앱 안(/g/{id}/)으로 연다 — 앱 범위를 벗어나면
 * 설치한 앱에서 브라우저 막대가 뜬다. 그 밖에는 서버가 준 모요라 경로(/groups/{id}).
 */
export const getNotificationTarget = (notification: Notification, appGroupId: number | null): string | null => {
	if (appGroupId !== null && notification.groupId === appGroupId) {
		const tab = notification.sourceTable === NOTIFICATION_SOURCE.SCHEDULE ? 'schedule' : 'home';
		return `${getGroupAppPath(appGroupId)}?tab=${tab}`;
	}
	return notification.targetUrl;
};

interface Props {
	/** 모임 전용 앱: 이 모임 알림만 보이고, 누르면 앱 안에서 연다 */
	scopeGroupId?: number;
}

export const NotificationBell = (props: Props) => {
	const scopeGroupId = props.scopeGroupId ?? null;
	const router = useRouter();
	const [isOpen, setIsOpen] = useState(false);
	const [filter, setFilter] = useState<Filter>(FILTER.ALL);
	const panelId = useId();
	const containerRef = useRef<HTMLDivElement>(null);
	const { data: unread } = useQuery({ ...notificationQueries.unreadCount(scopeGroupId) });
	const recentQuery = useQuery({ ...notificationQueries.recent(scopeGroupId), enabled: isOpen });
	const { mutate: readNotification } = useReadNotification();
	const { mutate: readAll } = useReadAllNotifications(scopeGroupId);
	const unreadCount = unread?.count ?? 0;

	// 바깥 클릭·Esc 로 닫는다
	useEffect(() => {
		if (!isOpen) return;
		const closeOnOutside = (event: MouseEvent) => {
			if (event.target instanceof Node && !containerRef.current?.contains(event.target)) setIsOpen(false);
		};
		const closeOnEscape = (event: KeyboardEvent) => {
			if (event.key === 'Escape') setIsOpen(false);
		};
		document.addEventListener('mousedown', closeOnOutside);
		document.addEventListener('keydown', closeOnEscape);
		return () => {
			document.removeEventListener('mousedown', closeOnOutside);
			document.removeEventListener('keydown', closeOnEscape);
		};
	}, [isOpen]);

	const select = (notification: Notification) => {
		if (!notification.isRead) readNotification(notification);
		setIsOpen(false);
		const target = getNotificationTarget(notification, scopeGroupId);
		if (target) router.history.push(target);
	};

	const renderList = () => {
		if (recentQuery.isPending) return <EmptyMessage message="불러오는 중..." />;
		if (recentQuery.isError) return <EmptyMessage message="알림을 불러오지 못했습니다." />;
		const items = filter === FILTER.UNREAD ? recentQuery.data.filter(item => !item.isRead) : recentQuery.data;
		if (items.length === 0) return <EmptyMessage message="알림이 없습니다." />;
		return (
			<ul className="max-h-80 overflow-y-auto">
				{items.map(item => (
					<NotificationItem key={item.notificationId} notification={item} onSelect={select} />
				))}
			</ul>
		);
	};

	return (
		<div ref={containerRef} className="relative">
			<button
				type="button"
				aria-label={unreadCount > 0 ? `알림 (읽지 않음 ${unreadCount}개)` : '알림'}
				aria-expanded={isOpen}
				aria-controls={panelId}
				onClick={() => setIsOpen(open => !open)}
				className="relative flex size-10 items-center justify-center rounded-full text-gray-600 hover:bg-gray-100 focus-visible:outline-2 focus-visible:outline-brand-600"
			>
				<Icon name="bell" size={22} />
				{unreadCount > 0 && (
					<span
						aria-hidden="true"
						className="absolute top-1 right-0.5 min-w-4 rounded-full bg-red-600 px-1 text-center text-[11px] leading-4 font-bold text-white ring-2 ring-white"
					>
						{formatBadgeCount(unreadCount)}
					</span>
				)}
			</button>
			{isOpen && (
				<section
					id={panelId}
					aria-label="알림 목록"
					className="absolute right-0 z-10 mt-2 w-80 max-w-[calc(100vw-2rem)] rounded-xl bg-white p-3 shadow-lg ring-1 ring-gray-200"
				>
					<header className="mb-2 flex items-center justify-between gap-2">
						<div role="group" aria-label="알림 필터" className="flex gap-1">
							{Object.values(FILTER).map(value => (
								<button
									key={value}
									type="button"
									aria-pressed={filter === value}
									onClick={() => setFilter(value)}
									className={cn(
										'rounded-full px-3 py-1 text-xs focus-visible:outline-2 focus-visible:outline-gray-900',
										filter === value ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-800',
									)}
								>
									{FILTER_LABEL[value]}
								</button>
							))}
						</div>
						<button
							type="button"
							onClick={() => readAll()}
							className="text-xs text-gray-600 underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-gray-900"
						>
							모두 읽음
						</button>
					</header>
					{renderList()}
				</section>
			)}
		</div>
	);
};

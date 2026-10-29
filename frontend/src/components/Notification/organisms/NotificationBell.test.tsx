import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { getNotificationTarget, NotificationBell } from '@/components/Notification/organisms/NotificationBell';
import {
	getNotifications,
	getUnreadNotificationCount,
	updateAllNotificationsRead,
	updateNotificationRead,
} from '@/modules/api/notification/notification';
import { renderWithProviders } from '@/test/render';
import type { Notification } from '@/types/Notification';

vi.mock('@/modules/api/notification/notification', () => ({
	getNotifications: vi.fn(),
	getUnreadNotificationCount: vi.fn(),
	updateNotificationRead: vi.fn(),
	updateAllNotificationsRead: vi.fn(),
}));
const historyPush = vi.fn();
vi.mock('@tanstack/react-router', async importOriginal => ({
	...(await importOriginal<typeof import('@tanstack/react-router')>()),
	useRouter: () => ({ history: { push: historyPush } }),
}));

const notification = (overrides: Partial<Notification>): Notification => ({
	notificationId: 1,
	sourceTable: 'SCHEDULE',
	category: 'APPROVE',
	title: '가입 승인',
	content: '모임01 가입이 승인되었습니다.',
	isRead: false,
	createdAt: '2026-10-01T01:00:00Z',
	groupId: 3,
	targetUrl: '/groups/3',
	...overrides,
});

describe('NotificationBell', () => {
	beforeEach(() => {
		vi.mocked(getUnreadNotificationCount).mockResolvedValue({ count: 2 });
		vi.mocked(getNotifications).mockResolvedValue([
			notification({ notificationId: 1 }),
			notification({ notificationId: 2, title: '공지', category: 'NOTICE', isRead: true, targetUrl: null }),
			notification({ notificationId: 3, title: '가입 반려', category: 'REJECT' }),
		]);
		vi.mocked(updateNotificationRead).mockResolvedValue(undefined);
		vi.mocked(updateAllNotificationsRead).mockResolvedValue(undefined);
		historyPush.mockReset();
	});

	it('읽지 않은 개수를 버튼 이름으로 알려주고, 열면 목록을 보여준다', async () => {
		renderWithProviders(<NotificationBell />);
		const bell = await screen.findByRole('button', { name: '알림 (읽지 않음 2개)' });

		await userEvent.click(bell);

		expect(bell).toHaveAttribute('aria-expanded', 'true');
		expect(await screen.findByText('공지')).toBeInTheDocument();
		expect(screen.getAllByRole('listitem')).toHaveLength(3);
	});

	it('읽지 않음 필터는 안 읽은 알림만 보여준다', async () => {
		renderWithProviders(<NotificationBell />);
		await userEvent.click(await screen.findByRole('button', { name: /알림/ }));
		await screen.findByText('공지');

		await userEvent.click(screen.getByRole('button', { name: '읽지 않음' }));

		expect(screen.queryByText('공지')).not.toBeInTheDocument();
		expect(screen.getAllByRole('listitem')).toHaveLength(2);
	});

	it('안 읽은 알림을 누르면 읽음 처리하고 대상 화면으로(SPA) 이동한다', async () => {
		renderWithProviders(<NotificationBell />);
		await userEvent.click(await screen.findByRole('button', { name: /알림/ }));
		await userEvent.click(await screen.findByRole('button', { name: /가입 승인/ }));

		await waitFor(() => expect(updateNotificationRead).toHaveBeenCalledWith(1));
		expect(historyPush).toHaveBeenCalledWith('/groups/3');
		expect(await screen.findByRole('button', { name: '알림 (읽지 않음 1개)' })).toBeInTheDocument();
	});

	it('모두 읽음은 배지를 없앤다', async () => {
		renderWithProviders(<NotificationBell />);
		await userEvent.click(await screen.findByRole('button', { name: /알림/ }));
		await userEvent.click(await screen.findByRole('button', { name: '모두 읽음' }));

		expect(await screen.findByRole('button', { name: '알림' })).toBeInTheDocument();
	});

	it('Esc 로 닫는다', async () => {
		renderWithProviders(<NotificationBell />);
		const bell = await screen.findByRole('button', { name: /알림/ });
		await userEvent.click(bell);
		await userEvent.keyboard('{Escape}');
		expect(bell).toHaveAttribute('aria-expanded', 'false');
	});

	it('모임 전용 앱에서는 그 모임 알림을 앱 안에서 연다', () => {
		const schedule = notification({ groupId: 4, targetUrl: '/groups/4' });
		expect(getNotificationTarget(schedule, 4)).toBe('/g/4/?tab=schedule');
		expect(getNotificationTarget({ ...schedule, sourceTable: 'GROUP_JOIN_REQUEST' }, 4)).toBe('/g/4/?tab=home');
		// 다른 모임·모요라에서는 서버가 준 경로
		expect(getNotificationTarget(schedule, 5)).toBe('/groups/4');
		expect(getNotificationTarget(schedule, null)).toBe('/groups/4');
	});
});

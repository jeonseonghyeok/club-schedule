import type { ReactNode } from 'react';
import { BottomNav, SideNav } from '@/components/layout/AppNav';
import { NotificationBell } from '@/components/Notification/organisms/NotificationBell';
import { cn } from '@/utils';

interface Props {
	/** 상단 바 제목(페이지 h1) */
	title: string;
	/** 제목 왼쪽(뒤로가기 등) */
	leading?: ReactNode;
	/** 알림 벨 오른쪽 */
	actions?: ReactNode;
	isLoggedIn: boolean;
	/** wide: 표가 많은 관리자 화면처럼 넓게 */
	width?: AppShellWidth;
	children: ReactNode;
}

export const APP_SHELL_WIDTH = { DEFAULT: 'default', WIDE: 'wide' } as const;
export type AppShellWidth = (typeof APP_SHELL_WIDTH)[keyof typeof APP_SHELL_WIDTH];

const MAX_WIDTH_CLASS = { default: 'max-w-3xl', wide: 'max-w-5xl' } as const satisfies Record<AppShellWidth, string>;

/**
 * 앱 공통 틀: 상단 바 + 본문 + 주 메뉴(휴대폰은 하단 탭바, md 이상은 왼쪽 레일).
 * 본문 아래 여백은 탭바 높이와 홈 인디케이터(safe-area)만큼 띄운다.
 */
export const AppShell = (props: Props) => {
	const { title, leading, actions, isLoggedIn, width = APP_SHELL_WIDTH.DEFAULT, children } = props;
	const maxWidth = MAX_WIDTH_CLASS[width];

	return (
		<div className="min-h-dvh md:pl-56">
			<SideNav />
			<header className="sticky top-0 z-20 border-b border-gray-200 bg-white/90 pt-safe backdrop-blur">
				<div className={cn('mx-auto flex h-14 items-center gap-1 px-4', maxWidth)}>
					{leading}
					<h1 className="min-w-0 truncate text-lg font-bold text-gray-900">{title}</h1>
					<div className="ml-auto flex shrink-0 items-center gap-2 *:whitespace-nowrap">
						{isLoggedIn && <NotificationBell />}
						{actions}
					</div>
				</div>
			</header>
			<main
				className={cn(
					'mx-auto flex flex-col gap-4 px-4 pt-4 pb-[calc(var(--spacing-tabbar)+env(safe-area-inset-bottom,0px)+1.5rem)] md:pb-10',
					maxWidth,
				)}
			>
				{children}
			</main>
			<BottomNav />
		</div>
	);
};

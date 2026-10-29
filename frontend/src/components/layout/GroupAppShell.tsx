import { Link } from '@tanstack/react-router';
import type { ReactNode } from 'react';
import { LoginLink } from '@/components/Auth/atoms/LoginLink';
import { Icon } from '@/components/common/atoms/Icon';
import type { IconName } from '@/components/common/atoms/Icon';
import { NotificationBell } from '@/components/Notification/organisms/NotificationBell';
import { useGoHome } from '@/hooks/useAppBackNavigation';
import { getIconLetter } from '@/utils/appIcon';

export const GROUP_APP_TAB_KEYS = ['home', 'schedule', 'members', 'manage', 'me'] as const;
export type GroupAppTab = (typeof GROUP_APP_TAB_KEYS)[number];

const TAB_META = {
	home: { label: '홈', icon: 'home' },
	schedule: { label: '일정', icon: 'calendar' },
	members: { label: '멤버', icon: 'users' },
	manage: { label: '관리', icon: 'settings' },
	me: { label: '내 정보', icon: 'user' },
} as const satisfies Record<GroupAppTab, { label: string; icon: IconName }>;

interface Props {
	groupId: number;
	appName: string;
	themeColor: string;
	isLoggedIn: boolean;
	tabs: readonly GroupAppTab[];
	activeTab: GroupAppTab;
	children: ReactNode;
}

/**
 * 모임 전용 앱 틀 — 모요라 메뉴(홈·지도·설정) 대신 그 모임의 메뉴만 둔다. 대표 색은 머리 글자와 선택된 메뉴에 쓴다.
 * 휴대폰은 하단 탭바, md 이상은 상단 바 아래 가로 메뉴.
 */
export const GroupAppShell = (props: Props) => {
	const { groupId, appName, themeColor, isLoggedIn, tabs, activeTab, children } = props;
	const goHome = useGoHome();

	const renderTab = (key: GroupAppTab, variant: 'bottom' | 'top') => {
		const isActive = key === activeTab;
		const meta = TAB_META[key];
		const className =
			variant === 'bottom'
				? 'flex h-full flex-col items-center justify-center gap-0.5 text-[11px] font-medium text-gray-500 focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-brand-600'
				: 'flex h-10 items-center gap-2 rounded-lg px-3 text-sm font-medium text-gray-600 hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-brand-600';
		return (
			<Link
				to="/g/$groupId/"
				params={{ groupId: String(groupId) }}
				search={{ tab: key }}
				aria-current={isActive ? 'page' : undefined}
				style={isActive ? { color: themeColor } : undefined}
				className={className}
				onClick={event => {
					// 홈은 기록을 쌓지 않고 맨 아래 홈으로 돌아간다
					if (key !== 'home') return;
					event.preventDefault();
					goHome();
				}}
			>
				<Icon name={meta.icon} size={variant === 'bottom' ? 22 : 18} strokeWidth={isActive ? 2.2 : 1.8} />
				<span className={isActive ? 'font-semibold' : undefined}>{meta.label}</span>
			</Link>
		);
	};

	return (
		<div className="min-h-dvh">
			<header className="sticky top-0 z-20 border-b border-gray-200 bg-white/90 pt-safe backdrop-blur">
				<div className="mx-auto flex h-14 max-w-3xl items-center gap-2.5 px-4">
					<span
						aria-hidden="true"
						style={{ backgroundColor: themeColor }}
						className="flex size-8 shrink-0 items-center justify-center rounded-lg text-sm font-extrabold text-white"
					>
						{getIconLetter(appName)}
					</span>
					<h1 className="min-w-0 truncate text-lg font-bold text-gray-900">{appName}</h1>
					<div className="ml-auto flex shrink-0 items-center gap-2 *:whitespace-nowrap">
						{isLoggedIn ? (
							<NotificationBell scopeGroupId={groupId} />
						) : (
							<LoginLink variant="primary" label="로그인" className="min-h-9 px-3" />
						)}
					</div>
				</div>
				<nav aria-label="모임 메뉴" className="mx-auto hidden max-w-3xl gap-1 px-3 pb-2 md:flex">
					{tabs.map(key => (
						<span key={key}>{renderTab(key, 'top')}</span>
					))}
				</nav>
			</header>
			<main className="mx-auto flex max-w-3xl flex-col gap-4 px-4 pt-4 pb-[calc(var(--spacing-tabbar)+env(safe-area-inset-bottom,0px)+1.5rem)] md:pb-10">
				{children}
			</main>
			<nav
				aria-label="모임 메뉴"
				className="fixed inset-x-0 bottom-0 z-30 border-t border-gray-200 bg-white/95 pb-safe backdrop-blur md:hidden"
			>
				<ul className="mx-auto flex h-tabbar max-w-md">
					{tabs.map(key => (
						<li key={key} className="flex-1">
							{renderTab(key, 'bottom')}
						</li>
					))}
				</ul>
			</nav>
		</div>
	);
};

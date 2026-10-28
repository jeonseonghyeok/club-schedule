import { Link, useRouterState } from '@tanstack/react-router';
import { Icon } from '@/components/common/atoms/Icon';
import type { IconName } from '@/components/common/atoms/Icon';
import { APP_NAME } from '@/constants';

export const NAV_KEY = { HOME: 'home', MAP: 'map', SETTINGS: 'settings' } as const;
export type NavKey = (typeof NAV_KEY)[keyof typeof NAV_KEY];

interface NavItem {
	readonly key: NavKey;
	readonly label: string;
	readonly icon: IconName;
}

const NAV_ITEMS = [
	{ key: NAV_KEY.HOME, label: '홈', icon: 'home' },
	{ key: NAV_KEY.MAP, label: '지도', icon: 'map' },
	{ key: NAV_KEY.SETTINGS, label: '설정', icon: 'settings' },
] as const satisfies readonly NavItem[];

/** 모임 화면은 홈 아래, 관리자 화면은 설정 아래로 본다 */
export const getActiveNav = (pathname: string): NavKey => {
	if (pathname.startsWith('/map')) return NAV_KEY.MAP;
	if (pathname.startsWith('/settings') || pathname.startsWith('/admin')) return NAV_KEY.SETTINGS;
	return NAV_KEY.HOME;
};

interface NavLinkProps {
	item: NavItem;
	isActive: boolean;
	className: string;
	iconSize: number;
}

const NavLink = (props: NavLinkProps) => {
	const { item, isActive, className, iconSize } = props;
	const common = {
		className,
		'aria-current': isActive ? ('page' as const) : undefined,
		'data-active': isActive || undefined,
	};
	const content = (
		<>
			<Icon name={item.icon} size={iconSize} strokeWidth={isActive ? 2.2 : 1.8} />
			<span>{item.label}</span>
		</>
	);
	switch (item.key) {
		case NAV_KEY.HOME:
			// 홈은 목록을 보러 가는 것이므로 우선모임 자동 이동을 건너뛴다(list=1)
			return (
				<Link to="/" search={{ list: 1 }} {...common}>
					{content}
				</Link>
			);
		case NAV_KEY.MAP:
			return (
				<Link to="/map" {...common}>
					{content}
				</Link>
			);
		case NAV_KEY.SETTINGS:
			return (
				<Link to="/settings" {...common}>
					{content}
				</Link>
			);
		default: {
			const exhaustive: never = item.key;
			return exhaustive;
		}
	}
};

const usePathname = (): string => useRouterState({ select: state => state.location.pathname });

/** 휴대폰: 화면 아래 고정 탭바 */
export const BottomNav = () => {
	const active = getActiveNav(usePathname());
	return (
		<nav
			aria-label="주 메뉴"
			className="fixed inset-x-0 bottom-0 z-30 border-t border-gray-200 bg-white/95 pb-safe backdrop-blur md:hidden"
		>
			<ul className="mx-auto flex h-tabbar max-w-md">
				{NAV_ITEMS.map(item => (
					<li key={item.key} className="flex-1">
						<NavLink
							item={item}
							isActive={item.key === active}
							iconSize={22}
							className="flex h-full flex-col items-center justify-center gap-0.5 text-[11px] font-medium text-gray-500 focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-brand-600 data-active:text-brand-700"
						/>
					</li>
				))}
			</ul>
		</nav>
	);
};

/** 태블릿·데스크톱: 왼쪽 레일 */
export const SideNav = () => {
	const active = getActiveNav(usePathname());
	return (
		<nav
			aria-label="주 메뉴"
			className="fixed inset-y-0 left-0 z-30 hidden w-56 flex-col border-r border-gray-200 bg-white px-3 py-5 md:flex"
		>
			<p className="mb-6 flex items-center gap-2 px-3 text-lg font-extrabold tracking-tight text-brand-800">
				<span aria-hidden="true" className="flex size-8 items-center justify-center rounded-lg bg-brand-700 text-white">
					<Icon name="calendar" size={18} strokeWidth={2.2} />
				</span>
				{APP_NAME}
			</p>
			<ul className="flex flex-col gap-1">
				{NAV_ITEMS.map(item => (
					<li key={item.key}>
						<NavLink
							item={item}
							isActive={item.key === active}
							iconSize={20}
							className="flex h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium text-gray-600 hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-brand-600 data-active:bg-brand-50 data-active:font-semibold data-active:text-brand-800"
						/>
					</li>
				))}
			</ul>
		</nav>
	);
};

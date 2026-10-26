import type { ReactNode } from 'react';
import { LogoutButton } from '@/components/Auth/organisms/LogoutButton';
import { NotificationBell } from '@/components/Notification/organisms/NotificationBell';

interface Props {
	isLoggedIn: boolean;
	/** 알림 벨과 로그아웃 사이 링크(관리자·메인으로 등) */
	actions?: ReactNode;
}

export const AppHeader = (props: Props) => {
	const { isLoggedIn, actions } = props;

	return (
		<header className="border-b border-gray-200 bg-white">
			<div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3">
				<div className="min-w-0">
					<p className="text-lg font-bold text-gray-900">Club Schedule</p>
					{/* 휴대폰 폭에서는 버튼이 두 줄로 꺾이지 않도록 부제를 숨긴다 */}
					<p className="hidden text-xs text-gray-500 sm:block">우리 모임의 일정을 한 눈에</p>
				</div>
				<nav aria-label="사용자 메뉴" className="ml-auto flex shrink-0 items-center gap-2 *:whitespace-nowrap sm:gap-3">
					{isLoggedIn && <NotificationBell />}
					{actions}
					{isLoggedIn && <LogoutButton />}
				</nav>
			</div>
		</header>
	);
};

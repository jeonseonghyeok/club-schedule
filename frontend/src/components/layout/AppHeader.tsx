import { buttonClassName } from '@/components/common/atoms/Button';
import { NotificationBell } from '@/components/Notification/organisms/NotificationBell';

interface Props {
	isLoggedIn: boolean;
	isAdmin: boolean;
}

export const AppHeader = (props: Props) => {
	const { isLoggedIn, isAdmin } = props;

	return (
		<header className="border-b border-gray-200 bg-white">
			<div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3">
				<div>
					<p className="text-lg font-bold text-gray-900">Club Schedule</p>
					<p className="text-xs text-gray-500">우리 모임의 일정을 한 눈에</p>
				</div>
				<nav aria-label="사용자 메뉴" className="ml-auto flex items-center gap-3">
					{isLoggedIn && <NotificationBell />}
					{/* 관리자 화면은 아직 서버 렌더링 — 전체 페이지 이동 */}
					{isAdmin && (
						<a href="/admin" className={buttonClassName('secondary')}>
							관리자
						</a>
					)}
				</nav>
			</div>
		</header>
	);
};

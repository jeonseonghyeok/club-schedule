import { useRouter } from '@tanstack/react-router';
import { Button } from '@/components/common/atoms/Button';
import { Icon } from '@/components/common/atoms/Icon';
import { resetToRoot } from '@/hooks/useAppBackNavigation';
import { useDeleteAuthSession } from '@/modules/stores/server/auth/mutations';

/**
 * 로그아웃하면 지금 앱(모요라·모임 전용 앱)의 시작 화면을 비회원 상태로 다시 연다.
 * 그동안의 화면 기록은 뒤로가기에 걸리지 않으므로 시작 화면에서 뒤로가기로 앱을 끝낼 수 있다.
 */
export const LogoutButton = () => {
	const router = useRouter();
	const { mutate: logout, isPending } = useDeleteAuthSession();

	return (
		<Button
			variant="secondary"
			disabled={isPending}
			onClick={() => logout(undefined, { onSuccess: () => resetToRoot(router.history) })}
		>
			<Icon name="logout" size={18} />
			로그아웃
		</Button>
	);
};

import { Button } from '@/components/common/atoms/Button';
import { Icon } from '@/components/common/atoms/Icon';
import { useDeleteAuthSession } from '@/modules/stores/server/auth/mutations';
import { getCurrentPath } from '@/utils/kakao';
import { navigateWithReload } from '@/utils/navigation';

/** 로그아웃 후 보던 화면을 비회원 상태로 다시 연다 — 모임 전용 앱에서 모요라 홈으로 넘어가지 않게 */
export const LogoutButton = () => {
	const { mutate: logout, isPending } = useDeleteAuthSession();

	return (
		<Button
			variant="secondary"
			disabled={isPending}
			onClick={() => logout(undefined, { onSuccess: () => navigateWithReload(getCurrentPath()) })}
		>
			<Icon name="logout" size={18} />
			로그아웃
		</Button>
	);
};

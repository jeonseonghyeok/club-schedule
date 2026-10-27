import { useNavigate } from '@tanstack/react-router';
import { Button } from '@/components/common/atoms/Button';
import { useDeleteAuthSession } from '@/modules/stores/server/auth/mutations';

export const LogoutButton = () => {
	const navigate = useNavigate();
	const { mutate: logout, isPending } = useDeleteAuthSession();

	return (
		<Button
			variant="secondary"
			disabled={isPending}
			onClick={() => logout(undefined, { onSuccess: () => void navigate({ to: '/', search: {} }) })}
		>
			로그아웃
		</Button>
	);
};

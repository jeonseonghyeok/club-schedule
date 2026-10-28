import { LoginLink } from '@/components/Auth/atoms/LoginLink';
import { Button } from '@/components/common/atoms/Button';
import { Dialog } from '@/components/common/organisms/Dialog';

interface Props {
	message: string;
	onClose: () => void;
}

/** 로그인이 필요한 동작을 눌렀을 때 — 로그인하거나 닫고 계속 둘러본다 */
export const LoginPromptDialog = (props: Props) => (
	<Dialog title="로그인이 필요해요" onClose={props.onClose}>
		<p className="text-sm text-gray-600">{props.message}</p>
		<div className="mt-5 flex flex-col gap-2">
			<LoginLink className="w-full" />
			<Button variant="secondary" className="w-full" onClick={props.onClose}>
				계속 둘러보기
			</Button>
		</div>
	</Dialog>
);

import { buttonClassName } from '@/components/common/atoms/Button';
import { Dialog } from '@/components/common/organisms/Dialog';
import { KAKAO_CALLBACK_PATH } from '@/utils/kakao';

interface Props {
	returnTo: string;
}

const noop = () => {};

/** 비회원이 메인에 들어오면 닫을 수 없는 로그인 안내를 띄운다 */
export const LoginRequiredDialog = (props: Props) => {
	const loginHref = `${KAKAO_CALLBACK_PATH}?${new URLSearchParams({ returnTo: props.returnTo }).toString()}`;

	return (
		<Dialog title="로그인 필요" dismissible={false} onClose={noop}>
			<p className="text-sm text-gray-600">모임 조회 및 신청을 하시려면 로그인이 필요합니다.</p>
			<div className="mt-4 flex gap-2">
				<a href={loginHref} className={buttonClassName('kakao')}>
					카카오 로그인
				</a>
			</div>
		</Dialog>
	);
};

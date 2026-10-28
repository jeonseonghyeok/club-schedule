import { buttonClassName } from '@/components/common/atoms/Button';
import type { ButtonVariant } from '@/components/common/atoms/Button';
import { buildLoginHref, getCurrentPath } from '@/utils/kakao';

interface Props {
	variant?: ButtonVariant;
	className?: string;
	label?: string;
}

/** 카카오 로그인 시작 — 로그인하면 지금 보던 화면으로 돌아온다(href 는 누르는 순간의 주소로 만든다) */
export const LoginLink = (props: Props) => {
	const { variant = 'kakao', className, label = '카카오 로그인' } = props;
	return (
		<a
			href={buildLoginHref('/')}
			onClick={event => {
				event.currentTarget.href = buildLoginHref(getCurrentPath());
			}}
			className={buttonClassName(variant, className)}
		>
			{label}
		</a>
	);
};

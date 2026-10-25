import type { ButtonHTMLAttributes } from 'react';
import { cn } from '@/utils';

export const BUTTON_VARIANT = { PRIMARY: 'primary', SECONDARY: 'secondary', DANGER: 'danger', KAKAO: 'kakao' } as const;
export type ButtonVariant = (typeof BUTTON_VARIANT)[keyof typeof BUTTON_VARIANT];

const VARIANT_CLASS = {
	primary: 'bg-gray-900 text-white hover:bg-gray-700',
	secondary: 'bg-white text-gray-800 ring-1 ring-gray-300 hover:bg-gray-50',
	danger: 'bg-red-700 text-white hover:bg-red-800',
	kakao: 'bg-yellow-300 text-gray-900 hover:bg-yellow-400',
} as const satisfies Record<ButtonVariant, string>;

/** <a> 에도 같은 모양을 쓰기 위해 클래스만 따로 노출한다 */
export const buttonClassName = (variant: ButtonVariant = BUTTON_VARIANT.PRIMARY, className?: string): string =>
	cn(
		'inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900 disabled:cursor-not-allowed disabled:opacity-50',
		VARIANT_CLASS[variant],
		className,
	);

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
	variant?: ButtonVariant;
}

export const Button = (props: Props) => {
	const { variant, className, type = 'button', ...rest } = props;
	return <button type={type} className={buttonClassName(variant, className)} {...rest} />;
};

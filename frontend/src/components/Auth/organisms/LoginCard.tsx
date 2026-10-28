import { LoginLink } from '@/components/Auth/atoms/LoginLink';

interface Props {
	title: string;
	message: string;
}

/** 로그인해야 보이는 영역 자리에 두는 안내 카드 */
export const LoginCard = (props: Props) => (
	<section className="flex flex-col gap-3 rounded-2xl bg-white p-5 ring-1 ring-gray-200">
		<div>
			<h2 className="text-[15px] font-bold text-gray-900">{props.title}</h2>
			<p className="mt-1 text-sm text-gray-600">{props.message}</p>
		</div>
		<LoginLink className="self-start" />
	</section>
);

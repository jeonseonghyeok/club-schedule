import { zodResolver } from '@hookform/resolvers/zod';
import { useId } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import type { TestAccount } from '@/types/Auth';

const testLoginSchema = z.object({
	kakaoApiId: z.string().min(1, '계정을 선택해주세요.'),
});

type TestLoginFormValues = z.infer<typeof testLoginSchema>;

interface Props {
	accounts: readonly TestAccount[];
	isSubmitting: boolean;
	onSubmit: (kakaoApiId: number) => void;
}

export const TestLoginForm = (props: Props) => {
	const { accounts, isSubmitting, onSubmit } = props;
	const selectId = useId();
	const errorId = useId();
	const {
		register,
		handleSubmit,
		formState: { errors },
	} = useForm<TestLoginFormValues>({
		resolver: zodResolver(testLoginSchema),
		defaultValues: { kakaoApiId: '' },
	});

	const submit = (values: TestLoginFormValues) => onSubmit(Number(values.kakaoApiId));
	const errorMessage = errors.kakaoApiId?.message;

	return (
		<form onSubmit={handleSubmit(submit)} noValidate className="flex flex-col gap-4">
			<div className="flex flex-col gap-1">
				<label htmlFor={selectId} className="text-sm font-medium text-gray-800">
					테스트 계정 선택
				</label>
				<select
					id={selectId}
					aria-invalid={!!errorMessage}
					aria-describedby={errorMessage ? errorId : undefined}
					className="rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus-visible:outline-2 focus-visible:outline-gray-900 aria-invalid:border-red-600"
					{...register('kakaoApiId')}
				>
					<option value="">-- 계정 선택 --</option>
					{accounts.map(account => (
						<option key={account.kakaoApiId} value={account.kakaoApiId}>
							{account.nickname}
						</option>
					))}
				</select>
				{errorMessage && (
					<p id={errorId} className="text-sm text-red-700">
						{errorMessage}
					</p>
				)}
			</div>
			<button
				type="submit"
				disabled={isSubmitting}
				className="rounded-md bg-gray-900 px-4 py-2 font-medium text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900 disabled:opacity-50"
			>
				{isSubmitting ? '로그인 중…' : '로그인'}
			</button>
		</form>
	);
};

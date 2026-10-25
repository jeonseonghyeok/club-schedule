import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TestLoginForm } from '@/components/Auth/organisms/TestLoginForm';

const ACCOUNTS = [
	{ kakaoApiId: 9900000000001, nickname: '관리자01' },
	{ kakaoApiId: 9900000000004, nickname: '모임리더01' },
] as const;

describe('TestLoginForm', () => {
	it('계정을 고르지 않고 제출하면 안내하고 onSubmit 을 부르지 않는다', async () => {
		const onSubmit = vi.fn();
		render(<TestLoginForm accounts={ACCOUNTS} isSubmitting={false} onSubmit={onSubmit} />);

		await userEvent.click(screen.getByRole('button', { name: '로그인' }));

		expect(await screen.findByText('계정을 선택해주세요.')).toBeInTheDocument();
		expect(screen.getByLabelText('테스트 계정 선택')).toHaveAttribute('aria-invalid', 'true');
		expect(onSubmit).not.toHaveBeenCalled();
	});

	it('선택한 계정의 kakaoApiId 를 숫자로 넘긴다', async () => {
		const onSubmit = vi.fn();
		render(<TestLoginForm accounts={ACCOUNTS} isSubmitting={false} onSubmit={onSubmit} />);

		await userEvent.selectOptions(screen.getByLabelText('테스트 계정 선택'), '모임리더01');
		await userEvent.click(screen.getByRole('button', { name: '로그인' }));

		expect(onSubmit).toHaveBeenCalledWith(9900000000004);
	});

	it('제출 중에는 버튼을 막는다', () => {
		render(<TestLoginForm accounts={ACCOUNTS} isSubmitting onSubmit={vi.fn()} />);
		expect(screen.getByRole('button', { name: '로그인 중…' })).toBeDisabled();
	});
});

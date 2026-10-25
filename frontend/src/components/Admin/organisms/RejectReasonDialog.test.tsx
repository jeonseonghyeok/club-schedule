import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RejectReasonDialog } from '@/components/Admin/organisms/RejectReasonDialog';

const PRESETS = ['모임명 부적절', '중복 모임'] as const;

describe('RejectReasonDialog', () => {
	it('선택지를 고르면 그 문구를 사유로 넘긴다', async () => {
		const onSubmit = vi.fn();
		render(
			<RejectReasonDialog
				title="거부"
				presets={PRESETS}
				isReasonRequired
				isSubmitting={false}
				onSubmit={onSubmit}
				onClose={vi.fn()}
			/>,
		);
		await userEvent.selectOptions(screen.getByLabelText('거부 사유'), '중복 모임');
		await userEvent.click(screen.getByRole('button', { name: '거부 확정' }));
		expect(onSubmit).toHaveBeenCalledWith('중복 모임');
	});

	it('기타를 고르면 직접 입력이 필요하다', async () => {
		const onSubmit = vi.fn();
		render(
			<RejectReasonDialog
				title="거부"
				presets={PRESETS}
				isReasonRequired
				isSubmitting={false}
				onSubmit={onSubmit}
				onClose={vi.fn()}
			/>,
		);
		await userEvent.selectOptions(screen.getByLabelText('거부 사유'), '기타 (직접 입력)');
		await userEvent.click(screen.getByRole('button', { name: '거부 확정' }));
		expect(await screen.findByText('거부 사유를 입력하세요.')).toBeInTheDocument();
		expect(onSubmit).not.toHaveBeenCalled();

		await userEvent.type(screen.getByLabelText('직접 입력'), ' 연락처 없음 ');
		await userEvent.click(screen.getByRole('button', { name: '거부 확정' }));
		expect(onSubmit).toHaveBeenCalledWith('연락처 없음');
	});

	it('선택 입력이면 빈 사유로도 거부할 수 있다', async () => {
		const onSubmit = vi.fn();
		render(
			<RejectReasonDialog
				title="거부"
				isReasonRequired={false}
				isSubmitting={false}
				onSubmit={onSubmit}
				onClose={vi.fn()}
			/>,
		);
		expect(screen.getByLabelText('거부 사유 (선택)')).toBeInTheDocument();
		await userEvent.click(screen.getByRole('button', { name: '거부 확정' }));
		expect(onSubmit).toHaveBeenCalledWith('');
	});
});

import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ModalHost } from '@/components/layout/ModalHost';
import { ModalType } from '@/constants';
import { useModalStore } from '@/modules/stores/client/modal';

describe('ModalHost', () => {
	afterEach(() => {
		act(() => useModalStore.getState().actions.closeModal());
	});

	it('열린 모달이 없으면 아무것도 렌더하지 않는다', () => {
		const { container } = render(<ModalHost />);
		expect(container).toBeEmptyDOMElement();
	});

	it('ALERT 모달을 띄우고 확인을 누르면 닫는다', async () => {
		render(<ModalHost />);
		act(() => useModalStore.getState().actions.openModal({ type: ModalType.ALERT, message: '저장했습니다.' }));

		expect(screen.getByRole('dialog')).toHaveAccessibleDescription('저장했습니다.');

		await userEvent.click(screen.getByRole('button', { name: '확인' }));

		expect(useModalStore.getState().modal).toBeNull();
		expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
	});

	it('REASON 모달은 사유 없이 처리하지 않고, 입력하면 닫은 뒤 사유를 넘긴다', async () => {
		const onSubmit = vi.fn();
		render(<ModalHost />);
		act(() =>
			useModalStore.getState().actions.openModal({
				type: ModalType.REASON,
				title: '일정 거부',
				reasonLabel: '거부 사유',
				confirmLabel: '거부',
				onSubmit,
			}),
		);

		await userEvent.click(screen.getByRole('button', { name: '거부' }));
		expect(await screen.findByText('거부 사유를 입력하세요.')).toBeInTheDocument();
		expect(onSubmit).not.toHaveBeenCalled();

		await userEvent.type(screen.getByLabelText('거부 사유'), '장소 미정');
		await userEvent.click(screen.getByRole('button', { name: '거부' }));

		await waitFor(() => expect(onSubmit).toHaveBeenCalledWith('장소 미정'));
		expect(useModalStore.getState().modal).toBeNull();
	});
});

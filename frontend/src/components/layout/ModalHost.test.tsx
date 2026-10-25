import { act, render, screen } from '@testing-library/react';
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
});

import { act, render, screen } from '@testing-library/react';
import { TOAST_DURATION_MS, ToastHost } from '@/components/layout/ToastHost';
import { useToastStore } from '@/modules/stores/client/toast';

describe('ToastHost', () => {
	it('안내를 잠깐 보여주고 사라진다', () => {
		vi.useFakeTimers();
		render(<ToastHost />);
		act(() => useToastStore.getState().actions.showToast('뒤로가기를 한 번 더 누르시면 종료합니다.'));
		expect(screen.getByRole('status')).toHaveTextContent('뒤로가기를 한 번 더 누르시면 종료합니다.');

		act(() => vi.advanceTimersByTime(TOAST_DURATION_MS));
		expect(screen.getByRole('status')).toBeEmptyDOMElement();
		vi.useRealTimers();
	});
});

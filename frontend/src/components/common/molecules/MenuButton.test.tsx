import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MenuButton } from '@/components/common/molecules/MenuButton';

describe('MenuButton', () => {
	it('열고 항목을 고르면 실행 후 닫힌다', async () => {
		const onSelect = vi.fn();
		render(<MenuButton label="더보기" icon="⋯" items={[{ label: '내 참가 이력', onSelect }]} />);

		await userEvent.click(screen.getByRole('button', { name: '더보기' }));
		await userEvent.click(screen.getByRole('menuitem', { name: '내 참가 이력' }));

		expect(onSelect).toHaveBeenCalledOnce();
		expect(screen.queryByRole('menu')).not.toBeInTheDocument();
	});

	it('Esc 로 닫는다', async () => {
		render(<MenuButton label="더보기" icon="⋯" items={[{ label: '탈퇴', onSelect: () => {}, tone: 'danger' }]} />);

		await userEvent.click(screen.getByRole('button', { name: '더보기' }));
		expect(screen.getByRole('menu')).toBeInTheDocument();
		await userEvent.keyboard('{Escape}');
		expect(screen.queryByRole('menu')).not.toBeInTheDocument();
	});
});

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { AdminTabs } from '@/components/Admin/organisms/AdminTabs';
import type { AdminTab } from '@/components/Admin/organisms/AdminTabs';

type Key = 'a' | 'b' | 'c';
const TABS: readonly AdminTab<Key>[] = [
	{ key: 'a', label: '회원', render: () => <p>회원 패널</p> },
	{ key: 'b', label: '그룹', render: () => <p>그룹 패널</p> },
	{ key: 'c', label: '그룹 신청', render: () => <p>신청 패널</p> },
];

const Harness = () => {
	const [selected, setSelected] = useState<Key>('a');
	return <AdminTabs tabs={TABS} selected={selected} onSelect={setSelected} />;
};

describe('AdminTabs', () => {
	it('선택한 탭의 패널만 보여주고 탭과 패널을 연결한다', async () => {
		render(<Harness />);
		await userEvent.click(screen.getByRole('tab', { name: '그룹' }));

		expect(screen.getByRole('tab', { name: '그룹' })).toHaveAttribute('aria-selected', 'true');
		expect(screen.getByRole('tabpanel', { name: '그룹' })).toHaveTextContent('그룹 패널');
		expect(screen.queryByText('회원 패널')).not.toBeInTheDocument();
	});

	it('화살표·Home·End 로 탭을 옮기고 포커스도 따라간다', async () => {
		render(<Harness />);
		screen.getByRole('tab', { name: '회원' }).focus();

		await userEvent.keyboard('{ArrowLeft}');
		expect(screen.getByRole('tab', { name: '그룹 신청' })).toHaveFocus();
		await userEvent.keyboard('{Home}');
		expect(screen.getByRole('tab', { name: '회원' })).toHaveAttribute('aria-selected', 'true');
		await userEvent.keyboard('{ArrowRight}');
		expect(screen.getByRole('tab', { name: '그룹' })).toHaveFocus();
		expect(screen.getByRole('tab', { name: '회원' })).toHaveAttribute('tabindex', '-1');
	});
});

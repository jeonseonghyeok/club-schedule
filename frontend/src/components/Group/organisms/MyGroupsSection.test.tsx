import { render, screen } from '@testing-library/react';
import { MyGroupsSection } from '@/components/Group/organisms/MyGroupsSection';

describe('MyGroupsSection', () => {
	it('비회원에게는 로그인 안내 카드를 보여주고 강제하지 않는다', () => {
		render(<MyGroupsSection state={{ status: 'guest' }} favoriteGroupId={null} />);

		expect(screen.getByRole('heading', { name: '내 모임' })).toBeInTheDocument();
		expect(screen.getByRole('link', { name: '카카오 로그인' })).toHaveAttribute(
			'href',
			expect.stringContaining('/login/kakao/login_callback'),
		);
	});
});

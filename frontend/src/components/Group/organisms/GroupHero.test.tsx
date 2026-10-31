import { screen } from '@testing-library/react';
import { GROUP_HERO_VARIANT, GroupHero } from '@/components/Group/organisms/GroupHero';
import { renderWithProviders } from '@/test/render';
import type { GroupDetail } from '@/types/GroupDetail';

const detail = {
	group: { groupId: 4, name: '독서 모임', capacity: 20, regionName: null },
	visibilityType: 'PUBLIC',
	viewer: {
		userKey: 1,
		isLeader: false,
		isManager: false,
		isMember: true,
		canCreateSchedule: false,
		createNeedsApproval: false,
		canManageSchedule: false,
		isFavoriteGroup: false,
		hasFavoriteGroup: false,
	},
} as unknown as GroupDetail;

describe('GroupHero', () => {
	it('모요라 모임 화면에서는 회원에게 우선모임 별을 보여준다', () => {
		renderWithProviders(<GroupHero groupId={4} detail={detail} />);
		expect(screen.getByRole('button', { name: '우선모임' })).toBeInTheDocument();
	});

	it('모임 전용 앱(compact)에는 우선모임 설정이 없다', () => {
		renderWithProviders(<GroupHero groupId={4} detail={detail} variant={GROUP_HERO_VARIANT.COMPACT} />);
		expect(screen.queryByRole('button', { name: '우선모임' })).not.toBeInTheDocument();
	});
});

import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemberInfoDialog } from '@/components/Member/organisms/MemberInfoDialog';
import { renderWithProviders } from '@/test/render';
import type { GroupMember } from '@/types/Member';

const member: GroupMember = {
	userKey: 7,
	displayName: '일반멤버01',
	groupNickname: null,
	role: 'MEMBER',
	status: 'ACTIVE',
	joinedAt: '2026-07-25T10:00:00',
	leftAt: null,
	banned: false,
	banReason: null,
	presets: null,
};

const renderDialog = (onWithdraw?: () => void) =>
	renderWithProviders(
		<MemberInfoDialog
			groupId={4}
			member={member}
			canEditRole={false}
			canKick={false}
			onKick={() => {}}
			onWithdraw={onWithdraw}
			onClose={() => {}}
		/>,
	);

describe('MemberInfoDialog', () => {
	it('내 정보로 열면 모임 탈퇴 버튼이 있다', async () => {
		const onWithdraw = vi.fn();
		renderDialog(onWithdraw);

		await userEvent.click(screen.getByRole('button', { name: '모임 탈퇴' }));
		expect(onWithdraw).toHaveBeenCalledOnce();
	});

	it('다른 회원 정보에는 탈퇴 버튼이 없다', () => {
		renderDialog();
		expect(screen.queryByRole('button', { name: '모임 탈퇴' })).not.toBeInTheDocument();
	});
});

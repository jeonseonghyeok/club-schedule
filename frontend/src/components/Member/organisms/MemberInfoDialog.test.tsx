import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemberInfoDialog } from '@/components/Member/organisms/MemberInfoDialog';
import { getMemberNicknameHistory, getMembers } from '@/modules/api/member/member';
import { renderWithProviders } from '@/test/render';
import type { GroupViewer } from '@/types/GroupDetail';
import type { GroupMember } from '@/types/Member';

vi.mock('@/modules/api/member/member', () => ({ getMembers: vi.fn(), getMemberNicknameHistory: vi.fn() }));

const member = (overrides: Partial<GroupMember>): GroupMember => ({
	userKey: 7,
	displayName: '일반멤버01',
	groupNickname: '일반멤버01',
	role: 'MEMBER',
	status: 'ACTIVE',
	joinedAt: '2026-07-25T10:00:00',
	leftAt: null,
	banned: false,
	banReason: null,
	presets: null,
	...overrides,
});

const MEMBERS = [
	member({ userKey: 1, displayName: '리더', role: 'LEADER' }),
	member({ userKey: 2, displayName: '매니저', role: 'MANAGER' }),
	member({ userKey: 7 }),
];

const viewerOf = (userKey: number, role: 'LEADER' | 'MANAGER' | 'MEMBER'): GroupViewer => ({
	userKey,
	isLeader: role === 'LEADER',
	isManager: role !== 'MEMBER',
	isMember: true,
	canCreateSchedule: true,
	createNeedsApproval: false,
	canManageSchedule: role !== 'MEMBER',
	isFavoriteGroup: false,
	hasFavoriteGroup: false,
});

const renderDialog = (params: { userKey: number; viewer: GroupViewer; onWithdraw?: () => void }) =>
	renderWithProviders(
		<MemberInfoDialog
			groupId={4}
			userKey={params.userKey}
			viewer={params.viewer}
			allowSelfNickname={false}
			onWithdraw={params.onWithdraw}
			onClose={() => {}}
		/>,
	);

const actionNames = async (): Promise<string[]> => {
	await screen.findByText('가입일');
	return ['직책 변경', '닉네임 변경', '내보내기'].filter(name => screen.queryByRole('button', { name }));
};

describe('MemberInfoDialog', () => {
	beforeEach(() => {
		vi.mocked(getMembers).mockResolvedValue(MEMBERS);
		vi.mocked(getMemberNicknameHistory).mockResolvedValue([
			{
				historyId: 1,
				userKey: 7,
				groupId: 4,
				groupName: null,
				oldNickname: '멤버',
				newNickname: '일반멤버01',
				changedBy: 1,
				changedByName: '리더',
				createdAt: '2026-10-31T10:00:00',
			},
		]);
	});

	it('리더는 일반회원에게 직책 변경·닉네임 변경·내보내기를 모두 쓸 수 있다', async () => {
		renderDialog({ userKey: 7, viewer: viewerOf(1, 'LEADER') });
		expect(await actionNames()).toEqual(['직책 변경', '닉네임 변경', '내보내기']);
	});

	it('매니저는 직책을 바꿀 수 없다', async () => {
		renderDialog({ userKey: 7, viewer: viewerOf(2, 'MANAGER') });
		expect(await actionNames()).toEqual(['닉네임 변경', '내보내기']);
	});

	it('일반회원은 다른 회원 정보와 닉네임 이력만 본다', async () => {
		renderDialog({ userKey: 2, viewer: viewerOf(7, 'MEMBER') });
		expect(await actionNames()).toEqual([]);

		await userEvent.click(screen.getByRole('button', { name: '닉네임 변경 이력' }));
		expect(await screen.findByText('리더님이 변경', { exact: false })).toBeInTheDocument();
	});

	it('직책 변경은 다음 대화상자에서 한다', async () => {
		renderDialog({ userKey: 7, viewer: viewerOf(1, 'LEADER') });
		await userEvent.click(await screen.findByRole('button', { name: '직책 변경' }));

		const dialog = screen.getByRole('dialog', { name: '직책 변경' });
		expect(within(dialog).getByLabelText('일반멤버01님의 직책')).toHaveValue('MEMBER');
		expect(within(dialog).getByRole('button', { name: '변경' })).toBeDisabled();
	});

	it('내 정보: 모임이 막아 두면 닉네임 변경 대신 안내, 탈퇴 버튼이 있다', async () => {
		const onWithdraw = vi.fn();
		renderDialog({ userKey: 7, viewer: viewerOf(7, 'MEMBER'), onWithdraw });
		expect(await actionNames()).toEqual([]);
		expect(screen.getByText(/모임장이 닉네임을 관리해요/)).toBeInTheDocument();

		await userEvent.click(screen.getByRole('button', { name: '모임 탈퇴' }));
		expect(onWithdraw).toHaveBeenCalledOnce();
	});
});

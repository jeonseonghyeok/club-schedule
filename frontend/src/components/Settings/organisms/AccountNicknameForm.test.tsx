import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AccountNicknameForm } from '@/components/Settings/organisms/AccountNicknameForm';
import { updateAccountNickname } from '@/modules/api/user/user';
import { renderWithProviders } from '@/test/render';
import type { MyGroup } from '@/types/Group';

vi.mock('@/modules/api/user/user', () => ({ updateAccountNickname: vi.fn() }));

const group = (overrides: Partial<MyGroup>): MyGroup => ({
	groupId: 1,
	name: '모임',
	description: null,
	leaderUserKey: 100,
	capacity: 10,
	currentMemberCount: 3,
	appEnabled: false,
	allowSelfNickname: true,
	regionName: null,
	myNickname: '길동',
	myRole: 'MEMBER',
	...overrides,
});

const groups = [
	group({ groupId: 1, name: '자유모임' }),
	group({ groupId: 2, name: '따로이름', myNickname: '총무' }),
	group({ groupId: 3, name: '관리모임', allowSelfNickname: false }),
	group({ groupId: 4, name: '내가매니저', allowSelfNickname: false, myRole: 'MANAGER' }),
];

describe('AccountNicknameForm', () => {
	it('이름을 바꾸면 모임 체크 목록이 나오고, 모임장이 관리하는 모임은 고를 수 없다', async () => {
		vi.mocked(updateAccountNickname).mockResolvedValue({
			nickname: '홍길동',
			updated: [{ groupId: 1, groupNickname: '홍길동' }],
			skipped: [{ groupId: 4, message: '이 모임에서 이미 쓰는 이름입니다.' }],
		});
		renderWithProviders(<AccountNicknameForm nickname="길동" groups={groups} />);
		expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();

		await userEvent.clear(screen.getByLabelText('계정 닉네임'));
		await userEvent.type(screen.getByLabelText('계정 닉네임'), '홍길동');

		// 계정 이름을 그대로 쓰던 모임만 미리 골라 둔다
		expect(screen.getByRole('checkbox', { name: /자유모임/ })).toBeChecked();
		expect(screen.getByRole('checkbox', { name: /따로이름/ })).not.toBeChecked();
		expect(screen.getByRole('checkbox', { name: /관리모임/ })).toBeDisabled();
		expect(screen.getByRole('checkbox', { name: /내가매니저/ })).toBeChecked();

		await userEvent.click(screen.getByRole('checkbox', { name: /따로이름/ }));
		await userEvent.click(screen.getByRole('button', { name: '저장' }));

		await waitFor(() =>
			expect(updateAccountNickname).toHaveBeenCalledWith({ nickname: '홍길동', groupIds: [1, 2, 4] }),
		);
		expect(await screen.findByText(/내가매니저: 이 모임에서 이미 쓰는 이름입니다/)).toBeInTheDocument();
	});
});

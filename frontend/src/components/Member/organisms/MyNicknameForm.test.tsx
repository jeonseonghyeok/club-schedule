import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MyNicknameForm } from '@/components/Member/organisms/MyNicknameForm';
import { updateMyNickname } from '@/modules/api/member/member';
import { renderWithProviders } from '@/test/render';

vi.mock('@/modules/api/member/member', () => ({ updateMyNickname: vi.fn() }));

describe('MyNicknameForm', () => {
	it('바꾼 닉네임을 공백을 정리해 저장한다', async () => {
		vi.mocked(updateMyNickname).mockResolvedValue({ groupNickname: '길동이' });
		const onSaved = vi.fn();
		renderWithProviders(<MyNicknameForm groupId={4} groupNickname={null} onSaved={onSaved} />);

		expect(screen.getByRole('button', { name: '저장' })).toBeDisabled();
		await userEvent.type(screen.getByLabelText('모임 닉네임'), '  길동이 ');
		await userEvent.click(screen.getByRole('button', { name: '저장' }));

		await waitFor(() => expect(updateMyNickname).toHaveBeenCalledWith({ groupId: 4, nickname: '길동이' }));
		await waitFor(() => expect(onSaved).toHaveBeenCalledOnce());
	});

	it('비우고 저장하면 계정 닉네임으로 돌아간다', async () => {
		vi.mocked(updateMyNickname).mockResolvedValue({ groupNickname: null });
		renderWithProviders(<MyNicknameForm groupId={4} groupNickname="길동이" onSaved={() => {}} />);

		await userEvent.clear(screen.getByLabelText('모임 닉네임'));
		await userEvent.click(screen.getByRole('button', { name: '저장' }));

		await waitFor(() => expect(updateMyNickname).toHaveBeenCalledWith({ groupId: 4, nickname: '' }));
	});
});

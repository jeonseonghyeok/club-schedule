import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GroupNicknameForm } from '@/components/Member/organisms/GroupNicknameForm';
import { updateMemberNickname, updateMyNickname } from '@/modules/api/member/member';
import { renderWithProviders } from '@/test/render';

vi.mock('@/modules/api/member/member', () => ({ updateMyNickname: vi.fn(), updateMemberNickname: vi.fn() }));

describe('GroupNicknameForm', () => {
	it('바꾼 닉네임을 공백을 정리해 저장한다', async () => {
		vi.mocked(updateMyNickname).mockResolvedValue({ groupNickname: '길동이' });
		const onSaved = vi.fn();
		renderWithProviders(<GroupNicknameForm groupId={4} groupNickname="홍길동" onSaved={onSaved} />);

		expect(screen.getByRole('button', { name: '저장' })).toBeDisabled();
		await userEvent.clear(screen.getByLabelText('모임 닉네임'));
		await userEvent.type(screen.getByLabelText('모임 닉네임'), '  길동이 ');
		await userEvent.click(screen.getByRole('button', { name: '저장' }));

		await waitFor(() => expect(updateMyNickname).toHaveBeenCalledWith({ groupId: 4, nickname: '길동이' }));
		await waitFor(() => expect(onSaved).toHaveBeenCalledOnce());
	});

	it('비우고 저장하면 서버가 계정 닉네임으로 맞춘다', async () => {
		vi.mocked(updateMyNickname).mockResolvedValue({ groupNickname: '홍길동' });
		renderWithProviders(<GroupNicknameForm groupId={4} groupNickname="길동이" onSaved={() => {}} />);

		await userEvent.clear(screen.getByLabelText('모임 닉네임'));
		await userEvent.click(screen.getByRole('button', { name: '저장' }));

		await waitFor(() => expect(updateMyNickname).toHaveBeenCalledWith({ groupId: 4, nickname: '' }));
	});

	it('회원을 지정하면 모임장·매니저용 API 로 그 회원의 이름을 바꾼다', async () => {
		vi.mocked(updateMemberNickname).mockResolvedValue({ groupNickname: '총무' });
		renderWithProviders(<GroupNicknameForm groupId={4} userKey={77} groupNickname="일반멤버" onSaved={() => {}} />);

		await userEvent.clear(screen.getByLabelText('모임 닉네임'));
		await userEvent.type(screen.getByLabelText('모임 닉네임'), '총무');
		await userEvent.click(screen.getByRole('button', { name: '저장' }));

		await waitFor(() =>
			expect(updateMemberNickname).toHaveBeenCalledWith({ groupId: 4, userKey: 77, nickname: '총무' }),
		);
		expect(updateMyNickname).not.toHaveBeenCalled();
	});
});

import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { JoinAction } from '@/components/JoinRequest/organisms/JoinAction';
import { createJoinRequest, deleteJoinRequest, getMyJoinRequests } from '@/modules/api/joinRequest/joinRequest';
import { useModalStore } from '@/modules/stores/client/modal';
import { renderWithProviders } from '@/test/render';
import type { JoinRequest } from '@/types/JoinRequest';

vi.mock('@/modules/api/joinRequest/joinRequest', () => ({
	getMyJoinRequests: vi.fn(),
	createJoinRequest: vi.fn(),
	deleteJoinRequest: vi.fn(),
}));

const request = (overrides: Partial<JoinRequest>): JoinRequest => ({
	requestId: 9,
	userKey: 7,
	nickname: null,
	status: 'PENDING',
	requestedAt: null,
	rejectReason: null,
	...overrides,
});

describe('JoinAction', () => {
	afterEach(() => {
		act(() => useModalStore.getState().actions.closeModal());
	});

	it('가입하기 → 확인 → 신청 후 "가입 신청 중"으로 바뀐다', async () => {
		vi.mocked(getMyJoinRequests).mockResolvedValue([]);
		vi.mocked(createJoinRequest).mockResolvedValue({ requestId: 11 });
		renderWithProviders(<JoinAction groupId={4} userKey={7} />);

		await userEvent.click(await screen.findByRole('button', { name: '가입하기' }));
		await userEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: '예' }));

		await waitFor(() => expect(createJoinRequest).toHaveBeenCalledWith(4));
		expect(await screen.findByRole('button', { name: '가입 신청 중' })).toBeInTheDocument();
	});

	it('신청 중이면 취소할 수 있고, 취소하면 다시 가입하기', async () => {
		vi.mocked(getMyJoinRequests).mockResolvedValue([request({})]);
		vi.mocked(deleteJoinRequest).mockResolvedValue(undefined);
		renderWithProviders(<JoinAction groupId={4} userKey={7} />);

		await userEvent.click(await screen.findByRole('button', { name: '가입 신청 중' }));
		await userEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: '예(가입취소)' }));

		await waitFor(() => expect(deleteJoinRequest).toHaveBeenCalledWith({ groupId: 4, requestId: 9 }));
		expect(await screen.findByRole('button', { name: '가입하기' })).toBeInTheDocument();
	});

	it('거부됐으면 사유를 볼 수 있고 다시 신청할 수 있다', async () => {
		vi.mocked(getMyJoinRequests).mockResolvedValue([request({ status: 'REJECTED', rejectReason: '정원 초과' })]);
		renderWithProviders(<JoinAction groupId={4} userKey={7} />);

		await userEvent.click(await screen.findByRole('button', { name: '가입 거부됨' }));
		expect(screen.getByRole('dialog', { description: '정원 초과' })).toBeInTheDocument();
		expect(screen.getByRole('button', { name: '가입하기' })).toBeInTheDocument();
	});
});

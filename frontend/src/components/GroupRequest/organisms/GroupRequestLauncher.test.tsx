import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GroupRequestLauncher } from '@/components/GroupRequest/organisms/GroupRequestLauncher';
import {
	createGroupRequest,
	getGroupRequests,
	updateGroupRequestCancel,
} from '@/modules/api/groupRequest/groupRequest';
import { useModalStore } from '@/modules/stores/client/modal';
import { renderWithProviders } from '@/test/render';
import type { GroupRequest } from '@/types/GroupRequest';

vi.mock('@/modules/api/groupRequest/groupRequest', () => ({
	getGroupRequests: vi.fn(),
	createGroupRequest: vi.fn(),
	updateGroupRequestCancel: vi.fn(),
}));

const USER_KEY = 7;

const request = (overrides: Partial<GroupRequest>): GroupRequest => ({
	requestId: 1,
	groupName: '등산 모임',
	description: '주말 등산',
	requestedAt: '2026-10-01T10:00:00',
	status: 'REJECTED',
	rejectReason: '중복',
	statusUpdatedAt: '2026-10-02T10:00:00',
	groupId: null,
	...overrides,
});

const openStatusDialog = async () => {
	await userEvent.click(screen.getByRole('button', { name: '신규모임 생성' }));
	return screen.findByRole('dialog', { name: '신청현황' });
};

describe('GroupRequestLauncher', () => {
	beforeEach(() => {
		vi.mocked(getGroupRequests).mockReset();
		vi.mocked(createGroupRequest).mockReset();
		vi.mocked(updateGroupRequestCancel).mockReset();
	});

	afterEach(() => {
		act(() => useModalStore.getState().actions.closeModal());
	});

	it('신청현황을 최신순으로 보여주고, 반려 건은 사유를 함께 보여준다', async () => {
		vi.mocked(getGroupRequests).mockResolvedValue([
			request({ requestId: 1, groupName: '오래된 신청', requestedAt: '2026-09-01T10:00:00' }),
			request({ requestId: 2, groupName: '최근 신청', requestedAt: '2026-10-05T10:00:00', status: 'APPROVED' }),
		]);
		renderWithProviders(<GroupRequestLauncher userKey={USER_KEY} groups={[]} />);

		const dialog = await openStatusDialog();
		const items = await within(dialog).findAllByRole('listitem');
		expect(items[0]).toHaveTextContent('최근 신청');
		expect(items[0]).toHaveTextContent('승인처리');
		expect(items[1]).toHaveTextContent('반려사유: 중복');
	});

	it('승인대기 신청이 있으면 신청 폼 대신 안내를 띄운다', async () => {
		vi.mocked(getGroupRequests).mockResolvedValue([request({ status: 'PENDING' })]);
		renderWithProviders(<GroupRequestLauncher userKey={USER_KEY} groups={[]} />);

		const dialog = await openStatusDialog();
		await within(dialog).findByText('등산 모임');
		await userEvent.click(within(dialog).getByRole('button', { name: '신청하기' }));

		expect(useModalStore.getState().modal).toMatchObject({
			message: '승인대기 건이 있어 신청하기를 할 수 없습니다.',
		});
		expect(screen.queryByRole('dialog', { name: '신청하기' })).not.toBeInTheDocument();
	});

	it('신청하면 승인대기로 목록 맨 위에 추가하고 신청현황으로 돌아간다', async () => {
		vi.mocked(getGroupRequests).mockResolvedValue([request({})]);
		vi.mocked(createGroupRequest).mockResolvedValue({ requestId: 99 });
		renderWithProviders(<GroupRequestLauncher userKey={USER_KEY} groups={[]} />);

		const statusDialog = await openStatusDialog();
		await within(statusDialog).findByText('등산 모임');
		await userEvent.click(within(statusDialog).getByRole('button', { name: '신청하기' }));

		const createDialog = await screen.findByRole('dialog', { name: '신청하기' });
		await userEvent.click(within(createDialog).getByRole('button', { name: '신청하기' }));
		expect(await within(createDialog).findByText('모임 이름을 입력하세요.')).toBeInTheDocument();

		await userEvent.type(within(createDialog).getByLabelText('모임 이름'), '  독서 모임 ');
		await userEvent.click(within(createDialog).getByRole('button', { name: '신청하기' }));

		await waitFor(() => expect(createGroupRequest).toHaveBeenCalled());
		expect(vi.mocked(createGroupRequest).mock.calls[0]?.[0]).toEqual({ groupName: '독서 모임', description: '' });
		const reopened = await screen.findByRole('dialog', { name: '신청현황' });
		const items = within(reopened).getAllByRole('listitem');
		expect(items[0]).toHaveTextContent('독서 모임');
		expect(items[0]).toHaveTextContent('승인대기');
	});

	it('신청 취소는 확인을 거쳐 신청취소 상태로 바꾼다', async () => {
		vi.mocked(getGroupRequests).mockResolvedValue([request({ requestId: 5, status: 'PENDING' })]);
		vi.mocked(updateGroupRequestCancel).mockResolvedValue(undefined);
		renderWithProviders(<GroupRequestLauncher userKey={USER_KEY} groups={[]} />);

		const dialog = await openStatusDialog();
		await userEvent.click(await within(dialog).findByRole('button', { name: '신청 취소' }));
		const confirm = await screen.findByRole('dialog', { description: '정말 신청을 취소하시겠습니까?' });
		await userEvent.click(within(confirm).getByRole('button', { name: '신청 취소' }));

		await waitFor(() => expect(updateGroupRequestCancel).toHaveBeenCalledWith(5));
		expect(await within(dialog).findByText('신청취소')).toBeInTheDocument();
		expect(within(dialog).queryByRole('button', { name: '신청 취소' })).not.toBeInTheDocument();
	});
});

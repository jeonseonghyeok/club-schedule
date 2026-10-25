import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GroupRequestsPanel } from '@/components/Admin/organisms/GroupRequestsPanel';
import {
	createGroupRequestApproval,
	createGroupRequestRejection,
	getAdminGroupRequests,
} from '@/modules/api/admin/admin';
import { useModalStore } from '@/modules/stores/client/modal';
import { renderWithProviders } from '@/test/render';
import type { AdminGroupRequest } from '@/types/Admin';
import type { Paging } from '@/types/Paging';

vi.mock('@/modules/api/admin/admin', () => ({
	getAdminGroupRequests: vi.fn(),
	createGroupRequestApproval: vi.fn(),
	createGroupRequestRejection: vi.fn(),
}));

const pending: AdminGroupRequest = {
	requestId: 11,
	userKey: 1000123,
	groupName: '독서 모임',
	description: '매주 책 한 권',
	requestedAt: '2026-10-20T10:00:00',
	status: 'PENDING',
	rejectReason: null,
	updatedBy: null,
	statusUpdatedAt: null,
	groupId: null,
};

const page = (items: AdminGroupRequest[]): Paging<AdminGroupRequest> => ({
	totalCount: items.length,
	currentPage: 1,
	size: 25,
	totalPages: 1,
	startPage: 1,
	endPage: 1,
	items,
});

describe('GroupRequestsPanel', () => {
	beforeEach(() => {
		vi.mocked(getAdminGroupRequests)
			.mockReset()
			.mockResolvedValue(page([pending]));
		vi.mocked(createGroupRequestApproval).mockReset();
		vi.mocked(createGroupRequestRejection).mockReset();
	});

	afterEach(() => {
		act(() => useModalStore.getState().actions.closeModal());
	});

	it('기본은 승인대기만 조회하고, 상태·키워드로 다시 조회한다', async () => {
		renderWithProviders(<GroupRequestsPanel />);
		expect(await screen.findByText('총 1건')).toBeInTheDocument();
		expect(getAdminGroupRequests).toHaveBeenLastCalledWith({ page: 1, q: '', status: 'PENDING' });

		await userEvent.selectOptions(screen.getByLabelText('상태'), '전체 이력');
		await userEvent.type(screen.getByLabelText('모임명'), '독서');
		await userEvent.click(screen.getByRole('button', { name: '조회' }));

		await waitFor(() => expect(getAdminGroupRequests).toHaveBeenLastCalledWith({ page: 1, q: '독서', status: '' }));
	});

	it('상세에서 승인하면 확인을 거쳐 승인하고, 새 모임을 열지 묻는다', async () => {
		vi.mocked(createGroupRequestApproval).mockResolvedValue({ groupId: 42 });
		renderWithProviders(<GroupRequestsPanel />);
		await userEvent.click(await screen.findByRole('button', { name: '[독서 모임] 신청 상세' }));

		const detail = screen.getByRole('dialog', { name: '그룹 신청 상세' });
		expect(detail).toHaveTextContent('매주 책 한 권');
		await userEvent.click(within(detail).getByRole('button', { name: '승인' }));

		const confirm = await screen.findByRole('dialog', { description: '[독서 모임] 신청을 승인하시겠습니까?' });
		await userEvent.click(within(confirm).getByRole('button', { name: '승인' }));

		await waitFor(() => expect(createGroupRequestApproval).toHaveBeenCalledWith(11));
		expect(
			await screen.findByRole('dialog', { description: /생성된 모임 화면을 새 탭으로 열까요/ }),
		).toBeInTheDocument();
	});

	it('거부는 사유를 받아 처리하고 완료를 알린다', async () => {
		vi.mocked(createGroupRequestRejection).mockResolvedValue(undefined);
		renderWithProviders(<GroupRequestsPanel />);
		await userEvent.click(await screen.findByRole('button', { name: '[독서 모임] 신청 상세' }));
		await userEvent.click(
			within(screen.getByRole('dialog', { name: '그룹 신청 상세' })).getByRole('button', { name: '거부' }),
		);

		const rejectDialog = await screen.findByRole('dialog', { name: '[독서 모임] 거부 사유 선택' });
		await userEvent.selectOptions(within(rejectDialog).getByLabelText('거부 사유'), '중복 모임');
		await userEvent.click(within(rejectDialog).getByRole('button', { name: '거부 확정' }));

		await waitFor(() =>
			expect(createGroupRequestRejection).toHaveBeenCalledWith({ requestId: 11, rejectReason: '중복 모임' }),
		);
		expect(await screen.findByRole('dialog', { description: '거부 처리되었습니다.' })).toBeInTheDocument();
	});
});

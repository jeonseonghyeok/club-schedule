import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AttendanceButton } from '@/components/Schedule/molecules/AttendanceButton';
import { createAttendance, deleteAttendance } from '@/modules/api/attendance/attendance';
import { useModalStore } from '@/modules/stores/client/modal';
import { renderWithProviders } from '@/test/render';
import type { AttendanceStatus, Schedule } from '@/types/Schedule';

vi.mock('@/modules/api/attendance/attendance', () => ({
	createAttendance: vi.fn(),
	deleteAttendance: vi.fn(),
	updateAttendeeApproval: vi.fn(),
	updateAttendeeRejection: vi.fn(),
	deleteAttendee: vi.fn(),
	updateAttendeeCheck: vi.fn(),
}));
vi.mock('@/modules/api/schedule/schedule', () => ({ getSchedules: vi.fn().mockResolvedValue([]) }));

const schedule = (myAttendanceStatus: AttendanceStatus | null): Schedule => ({
	id: 5,
	title: '번개',
	description: null,
	locationName: null,
	latitude: null,
	longitude: null,
	start: 0,
	end: null,
	status: 'CONFIRMED',
	statusReason: null,
	createdBy: 1,
	maxAttendance: 0,
	confirmedCount: 0,
	myAttendanceStatus,
});

describe('AttendanceButton', () => {
	afterEach(() => {
		act(() => useModalStore.getState().actions.closeModal());
		vi.mocked(createAttendance).mockReset();
		vi.mocked(deleteAttendance).mockReset();
	});

	it('신청 전이면 참가 신청, 거부됐으면 재신청', () => {
		const first = renderWithProviders(<AttendanceButton groupId={1} schedule={schedule(null)} size="full" />);
		expect(screen.getByRole('button', { name: '번개 참가 신청' })).toBeInTheDocument();
		first.unmount();
		renderWithProviders(<AttendanceButton groupId={1} schedule={schedule('REJECTED')} size="full" />);
		expect(screen.getByRole('button', { name: '번개 참가 재신청' })).toBeInTheDocument();
	});

	it('참가 신청하면 요청하고 완료를 알린다', async () => {
		vi.mocked(createAttendance).mockResolvedValue(undefined);
		renderWithProviders(<AttendanceButton groupId={1} schedule={schedule('CANCELLED')} size="full" />);
		await userEvent.click(screen.getByRole('button', { name: '번개 참가 신청' }));
		await waitFor(() => expect(createAttendance).toHaveBeenCalledWith({ groupId: 1, scheduleId: 5 }));
		expect(await screen.findByRole('dialog', { description: '참가 신청이 완료되었습니다.' })).toBeInTheDocument();
	});

	it('대기 중이면 안내와 함께 취소(확인 후)', async () => {
		vi.mocked(deleteAttendance).mockResolvedValue(undefined);
		renderWithProviders(<AttendanceButton groupId={1} schedule={schedule('PENDING')} size="compact" />);
		expect(screen.getByRole('status')).toHaveTextContent('대기중');

		await userEvent.click(screen.getByRole('button', { name: '번개 참가 취소' }));
		const confirm = screen.getByRole('dialog', { description: '참가를 취소하시겠습니까?' });
		await userEvent.click(within(confirm).getByRole('button', { name: '참가 취소' }));
		await waitFor(() => expect(deleteAttendance).toHaveBeenCalledWith({ groupId: 1, scheduleId: 5 }));
	});
});

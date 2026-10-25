import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AttendeeManageDialog } from '@/components/Schedule/organisms/AttendeeManageDialog';
import { getAttendees, updateAttendeeCheck } from '@/modules/api/attendance/attendance';
import { renderWithProviders } from '@/test/render';
import type { GroupViewer } from '@/types/GroupDetail';
import type { Schedule } from '@/types/Schedule';

vi.mock('@/modules/api/attendance/attendance', () => ({
	getAttendees: vi.fn(),
	getAttendanceHistory: vi.fn().mockResolvedValue([]),
	updateAttendeeCheck: vi.fn(),
	updateAttendeeApproval: vi.fn(),
	updateAttendeeRejection: vi.fn(),
	deleteAttendee: vi.fn(),
}));
vi.mock('@/modules/api/schedule/schedule', () => ({ getSchedules: vi.fn().mockResolvedValue([]) }));

const pastSchedule: Schedule = {
	id: 3,
	title: '지난 모임',
	description: null,
	locationName: null,
	start: Date.now() - 60_000,
	end: null,
	status: 'CONFIRMED',
	createdBy: 1,
	maxAttendance: 0,
	confirmedCount: 2,
	myAttendanceStatus: null,
};

const manager: GroupViewer = {
	userKey: 1,
	isLeader: true,
	isManager: true,
	isMember: true,
	canCreateSchedule: true,
	createNeedsApproval: false,
	canManageSchedule: true,
	isFavoriteGroup: false,
	hasFavoriteGroup: false,
};

describe('AttendeeManageDialog', () => {
	it('참석 체크 일괄 저장 — 일부 실패하면 실패한 인원만 알려준다', async () => {
		vi.mocked(getAttendees).mockResolvedValue([
			{ userKey: 10, displayName: '가나', status: 'CONFIRMED', actualStatus: 'NONE' },
			{ userKey: 11, displayName: '다라', status: 'CONFIRMED', actualStatus: 'ATTENDED' },
			{ userKey: 12, displayName: '마바', status: 'PENDING', actualStatus: null },
		]);
		vi.mocked(updateAttendeeCheck).mockImplementation(async target => {
			if (target.userKey === 11) throw new Error('fail');
		});
		renderWithProviders(
			<AttendeeManageDialog groupId={4} schedule={pastSchedule} viewer={manager} onClose={vi.fn()} />,
		);

		await userEvent.click(screen.getByRole('tab', { name: '참석확인' }));
		await userEvent.click(await screen.findByRole('button', { name: '수정' }));
		await userEvent.click(screen.getByRole('button', { name: '전체 불참' }));
		expect(screen.getByText('참가자 2명 / 참석 0명 / 불참 2명 / 체크누락 0명')).toBeInTheDocument();
		await userEvent.click(screen.getByRole('button', { name: '저장' }));

		await waitFor(() => expect(updateAttendeeCheck).toHaveBeenCalledTimes(2));
		const alert = await screen.findByRole('dialog', { description: /다음 인원 저장에 실패했습니다: 다라/ });
		expect(within(alert).getByRole('button', { name: '확인' })).toBeInTheDocument();
	});
});

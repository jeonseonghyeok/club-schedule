import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ScheduleFormDialog } from '@/components/Schedule/organisms/ScheduleFormDialog';
import type { Schedule } from '@/types/Schedule';

const source: Schedule = {
	id: 7,
	title: '정기 모임',
	description: '회의',
	locationName: '강남역',
	start: new Date(2026, 9, 1, 19, 15).getTime(),
	end: new Date(2026, 9, 1, 21, 15).getTime(),
	status: 'CONFIRMED',
	createdBy: 1,
	maxAttendance: 8,
	confirmedCount: 3,
	myAttendanceStatus: null,
};

const renderForm = (mode: Parameters<typeof ScheduleFormDialog>[0]['mode']) => {
	const onCreate = vi.fn();
	const onEdit = vi.fn();
	render(
		<ScheduleFormDialog
			mode={mode}
			showApprovalNotice
			isSubmitting={false}
			onCreate={onCreate}
			onEdit={onEdit}
			onClose={vi.fn()}
		/>,
	);
	return { onCreate, onEdit, dialog: screen.getByRole('dialog') };
};

describe('ScheduleFormDialog', () => {
	it('새 일정: 제목이 없으면 막고, 종료는 시작 + 1시간을 따라간다', async () => {
		const { onCreate, dialog } = renderForm({ type: 'create', date: new Date(2026, 11, 24) });
		expect(within(dialog).getByText('이 그룹에서는 일정 등록 후 관리자 승인이 필요합니다.')).toBeInTheDocument();

		await userEvent.click(within(dialog).getByRole('button', { name: '저장' }));
		expect(await within(dialog).findByText('제목을 입력하세요.')).toBeInTheDocument();
		expect(onCreate).not.toHaveBeenCalled();

		await userEvent.type(within(dialog).getByLabelText('제목'), '송년회');
		await userEvent.selectOptions(within(dialog).getByLabelText('시작 시간 시'), '18');
		await userEvent.selectOptions(within(dialog).getByLabelText('시작 시간 분'), '00');
		expect(within(dialog).getByLabelText('종료 시간 시')).toHaveValue('19');

		await userEvent.click(within(dialog).getByRole('button', { name: '저장' }));
		expect(onCreate).toHaveBeenCalledWith({
			title: '송년회',
			content: null,
			location_name: null,
			start: new Date(2026, 11, 24, 18, 0).getTime(),
			end: new Date(2026, 11, 24, 19, 0).getTime(),
			max_attendance: 0,
		});
	});

	it('종료가 시작보다 빠르면 저장하지 않는다', async () => {
		const { onCreate, dialog } = renderForm({ type: 'create', date: new Date(2026, 11, 24) });
		await userEvent.type(within(dialog).getByLabelText('제목'), '송년회');
		await userEvent.selectOptions(within(dialog).getByLabelText('시작 시간 시'), '18');
		await userEvent.selectOptions(within(dialog).getByLabelText('종료 시간 시'), '17');
		await userEvent.click(within(dialog).getByRole('button', { name: '저장' }));
		expect(await within(dialog).findByText('종료시간은 시작시간보다 이후여야 합니다.')).toBeInTheDocument();
		expect(onCreate).not.toHaveBeenCalled();
	});

	it('수정: 원래 값을 채우고(분 단위·인원 제한 포함) 변경 사유가 필수다', async () => {
		const { onEdit, dialog } = renderForm({ type: 'edit', source });
		expect(within(dialog).getByLabelText('제목')).toHaveValue('정기 모임');
		expect(within(dialog).getByLabelText('분 단위 입력')).toBeChecked();
		expect(within(dialog).getByLabelText('최대 인원')).toHaveValue(8);

		await userEvent.click(within(dialog).getByRole('button', { name: '저장' }));
		expect(await within(dialog).findByText('변경 사유는 필수입니다.')).toBeInTheDocument();

		await userEvent.type(within(dialog).getByLabelText(/변경 사유/), '장소 변경');
		await userEvent.clear(within(dialog).getByLabelText('장소'));
		await userEvent.type(within(dialog).getByLabelText('장소'), '역삼역');
		await userEvent.click(within(dialog).getByRole('button', { name: '저장' }));
		expect(onEdit).toHaveBeenCalledWith({
			changeReason: '장소 변경',
			title: '정기 모임',
			content: '회의',
			location_name: '역삼역',
			start: source.start,
			end: source.end,
			max_attendance: 8,
		});
	});
});

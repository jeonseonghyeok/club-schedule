import { useQuery } from '@tanstack/react-query';
import { AttendeeManageDialog } from '@/components/Schedule/organisms/AttendeeManageDialog';
import { DayScheduleDialog } from '@/components/Schedule/organisms/DayScheduleDialog';
import { ScheduleDetailDialog } from '@/components/Schedule/organisms/ScheduleDetailDialog';
import { ScheduleFormDialog } from '@/components/Schedule/organisms/ScheduleFormDialog';
import type { ScheduleFormMode } from '@/components/Schedule/organisms/ScheduleFormDialog';
import { ModalType } from '@/constants';
import { useScheduleStatusChange } from '@/hooks/useScheduleStatusChange';
import { useModalStore } from '@/modules/stores/client/modal';
import { useScheduleDialogStore } from '@/modules/stores/client/scheduleDialog';
import type { ScheduleDialogView } from '@/modules/stores/client/scheduleDialog';
import { useCreateSchedule, useUpdateSchedule } from '@/modules/stores/server/schedule/mutations';
import { scheduleQueries } from '@/modules/stores/server/schedule/queries';
import type { GroupViewer } from '@/types/GroupDetail';
import type { Schedule } from '@/types/Schedule';
import { toDateKey } from '@/utils/schedule';

interface Props {
	groupId: number;
	viewer: GroupViewer;
}

const findSchedule = (schedules: readonly Schedule[] | undefined, scheduleId: number) =>
	schedules?.find(schedule => schedule.id === scheduleId);

const toFormMode = (view: ScheduleDialogView, schedules: readonly Schedule[] | undefined): ScheduleFormMode | null => {
	if (view.type === 'create') return { type: 'create', date: new Date(view.dateMs) };
	if (view.type !== 'edit' && view.type !== 'duplicate') return null;
	const source = findSchedule(schedules, view.scheduleId);
	return source ? { type: view.type, source } : null;
};

/** 모임 화면의 일정 모달들 — 열린 모달은 scheduleDialog 스토어가 정한다 */
export const ScheduleDialogs = (props: Props) => {
	const { groupId, viewer } = props;
	const view = useScheduleDialogStore(state => state.view);
	const { open, close } = useScheduleDialogStore(state => state.actions);
	const openModal = useModalStore(state => state.actions.openModal);
	const { data: schedules } = useQuery({ ...scheduleQueries.list(groupId) });
	const changeStatus = useScheduleStatusChange(groupId);
	const { mutate: create, isPending: isCreating } = useCreateSchedule(groupId);
	const { mutate: update, isPending: isUpdating } = useUpdateSchedule(groupId);

	if (view.type === 'none') return null;

	if (view.type === 'day') {
		const date = new Date(view.dateMs);
		const key = toDateKey(date);
		const daySchedules = schedules?.filter(schedule => toDateKey(new Date(schedule.start)) === key) ?? [];
		return (
			<DayScheduleDialog
				groupId={groupId}
				date={date}
				schedules={daySchedules}
				viewer={viewer}
				onOpen={schedule => open({ type: 'detail', scheduleId: schedule.id, fromDayMs: view.dateMs })}
				onCreate={() => open({ type: 'create', dateMs: view.dateMs })}
				onClose={close}
			/>
		);
	}

	if (view.type === 'detail') {
		const schedule = findSchedule(schedules, view.scheduleId);
		if (!schedule) return null;
		const fromDayMs = view.fromDayMs;
		return (
			<ScheduleDetailDialog
				groupId={groupId}
				schedule={schedule}
				viewer={viewer}
				onBack={fromDayMs === null ? null : () => open({ type: 'day', dateMs: fromDayMs })}
				onChangeStatus={action => changeStatus(schedule.id, action)}
				onEdit={() => open({ type: 'edit', scheduleId: schedule.id })}
				onDuplicate={() => open({ type: 'duplicate', scheduleId: schedule.id })}
				onManageAttendees={() => open({ type: 'attendees', scheduleId: schedule.id })}
				onClose={close}
			/>
		);
	}

	if (view.type === 'attendees') {
		const schedule = findSchedule(schedules, view.scheduleId);
		if (!schedule) return null;
		return <AttendeeManageDialog groupId={groupId} schedule={schedule} viewer={viewer} onClose={close} />;
	}

	const mode = toFormMode(view, schedules);
	if (!mode) return null;
	const done = (message: string) => {
		close();
		openModal({ type: ModalType.ALERT, message });
	};
	return (
		<ScheduleFormDialog
			// 모드가 바뀌면(복제 → 다른 일정 등) 폼 기본값을 새로 잡는다
			key={JSON.stringify(view)}
			mode={mode}
			showApprovalNotice={viewer.createNeedsApproval && !viewer.canManageSchedule}
			isSubmitting={isCreating || isUpdating}
			onCreate={payload => create(payload, { onSuccess: () => done('일정이 추가되었습니다.') })}
			onEdit={payload =>
				mode.type === 'edit' &&
				update({ scheduleId: mode.source.id, payload }, { onSuccess: () => done('일정이 수정되었습니다.') })
			}
			onClose={close}
		/>
	);
};

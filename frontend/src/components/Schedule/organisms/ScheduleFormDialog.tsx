import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useId, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/common/atoms/Button';
import { Dialog } from '@/components/common/organisms/Dialog';
import { DateTimeField } from '@/components/Schedule/molecules/DateTimeField';
import type { Schedule, ScheduleEditPayload, SchedulePayload } from '@/types/Schedule';
import {
	COARSE_MINUTE_OPTIONS,
	FINE_MINUTE_OPTIONS,
	fromDateTimeParts,
	getDefaultStart,
	needsFineMinutes,
	roundDownToHalfHour,
	toDateTimeParts,
} from '@/utils/dateTime';
import { HOUR_MS } from '@/utils/schedule';

const DEFAULT_MAX_ATTENDANCE = '10';
const TITLE_MAX = 100;

/** create: 새 일정, duplicate: 기존 일정 내용으로 오늘 같은 시각에 새로, edit: 수정(변경 사유 필수) */
export type ScheduleFormMode =
	{ type: 'create'; date: Date } | { type: 'duplicate'; source: Schedule } | { type: 'edit'; source: Schedule };

interface ScheduleFormValues {
	changeReason: string;
	title: string;
	content: string;
	locationName: string;
	startDate: string;
	startHour: string;
	startMinute: string;
	endDate: string;
	endHour: string;
	endMinute: string;
	isFineMinute: boolean;
	hasLimit: boolean;
	maxAttendance: string;
}

interface Props {
	mode: ScheduleFormMode;
	/** 등록 후 관리자 승인이 필요하다는 안내를 보여줄지 */
	showApprovalNotice: boolean;
	isSubmitting: boolean;
	onCreate: (payload: SchedulePayload) => void;
	onEdit: (payload: ScheduleEditPayload) => void;
	onClose: () => void;
}

const startOf = (values: ScheduleFormValues) =>
	fromDateTimeParts({ date: values.startDate, hour: values.startHour, minute: values.startMinute });
const endOf = (values: ScheduleFormValues) =>
	fromDateTimeParts({ date: values.endDate, hour: values.endHour, minute: values.endMinute });

const buildSchema = (isEdit: boolean) =>
	z
		.object({
			changeReason: z.string().trim(),
			title: z.string().trim().max(TITLE_MAX, `제목은 ${TITLE_MAX}자까지 입력할 수 있습니다.`),
			content: z.string().trim(),
			locationName: z.string().trim(),
			startDate: z.string(),
			startHour: z.string(),
			startMinute: z.string(),
			endDate: z.string(),
			endHour: z.string(),
			endMinute: z.string(),
			isFineMinute: z.boolean(),
			hasLimit: z.boolean(),
			maxAttendance: z.string(),
		})
		.superRefine((values, context) => {
			const issue = (path: keyof ScheduleFormValues, message: string) =>
				context.addIssue({ code: 'custom', path: [path], message });
			if (isEdit && !values.changeReason) issue('changeReason', '변경 사유는 필수입니다.');
			if (!values.title) issue('title', '제목을 입력하세요.');
			const start = startOf(values);
			const end = endOf(values);
			if (!start) issue('startDate', '시작 시간을 입력하세요.');
			if (start && end && end.getTime() <= start.getTime())
				issue('endDate', '종료시간은 시작시간보다 이후여야 합니다.');
			if (values.hasLimit && !(Number(values.maxAttendance) >= 1)) issue('maxAttendance', '1명 이상 입력하세요.');
		});

const buildDefaults = (mode: ScheduleFormMode, now: Date): ScheduleFormValues => {
	const base = {
		changeReason: '',
		title: '',
		content: '',
		locationName: '',
		hasLimit: false,
		maxAttendance: DEFAULT_MAX_ATTENDANCE,
	};
	const withTimes = (start: Date, end: Date) => {
		const startParts = toDateTimeParts(start);
		const endParts = toDateTimeParts(end);
		return {
			startDate: startParts.date,
			startHour: startParts.hour,
			startMinute: startParts.minute,
			endDate: endParts.date,
			endHour: endParts.hour,
			endMinute: endParts.minute,
			isFineMinute: needsFineMinutes(start, end),
		};
	};

	if (mode.type === 'create') {
		const start = getDefaultStart(mode.date, now);
		return { ...base, ...withTimes(start, new Date(start.getTime() + HOUR_MS)) };
	}

	const source = mode.source;
	const sourceFields = {
		title: source.title ?? '',
		content: source.description ?? '',
		locationName: source.locationName ?? '',
		hasLimit: source.maxAttendance > 0,
		maxAttendance: source.maxAttendance > 0 ? String(source.maxAttendance) : DEFAULT_MAX_ATTENDANCE,
	};
	if (mode.type === 'edit') {
		const start = new Date(source.start);
		const end = new Date(source.end ?? source.start + HOUR_MS);
		return { ...base, ...sourceFields, ...withTimes(start, end) };
	}
	// 복제: 오늘 같은 시각, 원래 일정과 같은 길이
	const original = new Date(source.start);
	const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), original.getHours(), original.getMinutes());
	const duration = source.end ? source.end - source.start : HOUR_MS;
	return { ...base, ...sourceFields, ...withTimes(start, new Date(start.getTime() + duration)) };
};

const toPayload = (values: ScheduleFormValues): SchedulePayload | null => {
	const start = startOf(values);
	if (!start) return null;
	const end = endOf(values) ?? new Date(start.getTime() + HOUR_MS);
	return {
		title: values.title.trim(),
		content: values.content.trim() || null,
		location_name: values.locationName.trim() || null,
		start: start.getTime(),
		end: end.getTime(),
		max_attendance: values.hasLimit ? Number(values.maxAttendance) : 0,
	};
};

const TITLE_BY_MODE = { create: '일정 등록', duplicate: '일정 등록', edit: '일정 수정' } as const satisfies Record<
	ScheduleFormMode['type'],
	string
>;

const INPUT_CLASS =
	'w-full rounded-md border border-gray-300 px-3 py-2 focus-visible:outline-2 focus-visible:outline-gray-900 aria-invalid:border-red-600';

export const ScheduleFormDialog = (props: Props) => {
	const { mode, showApprovalNotice, isSubmitting, onCreate, onEdit, onClose } = props;
	const isEdit = mode.type === 'edit';
	const id = useId();
	const [now] = useState(() => new Date());
	// 사용자가 종료 시간을 직접 바꾸기 전까지는 시작 시간 + 1시간을 따라간다(수정·복제는 처음부터 고정)
	const [isEndTouched, setIsEndTouched] = useState(mode.type !== 'create');
	const {
		register,
		handleSubmit,
		control,
		setValue,
		getValues,
		formState: { errors },
	} = useForm<ScheduleFormValues>({
		resolver: zodResolver(buildSchema(isEdit)),
		defaultValues: buildDefaults(mode, now),
	});
	const [startDate, startHour, startMinute, isFineMinute, hasLimit] = useWatch({
		control,
		name: ['startDate', 'startHour', 'startMinute', 'isFineMinute', 'hasLimit'],
	});

	useEffect(() => {
		if (isEndTouched) return;
		const start = fromDateTimeParts({ date: startDate, hour: startHour, minute: startMinute });
		if (!start) return;
		const end = toDateTimeParts(new Date(start.getTime() + HOUR_MS));
		setValue('endDate', end.date);
		setValue('endHour', end.hour);
		setValue('endMinute', end.minute);
	}, [startDate, startHour, startMinute, isEndTouched, setValue]);

	const toggleFineMinute = (fine: boolean) => {
		if (!fine) {
			setValue('startMinute', roundDownToHalfHour(getValues('startMinute')));
			setValue('endMinute', roundDownToHalfHour(getValues('endMinute')));
		}
	};

	const submit = (values: ScheduleFormValues) => {
		const payload = toPayload(values);
		if (!payload) return;
		if (isEdit) onEdit({ ...payload, changeReason: values.changeReason.trim() });
		else onCreate(payload);
	};

	const minuteOptions = isFineMinute ? FINE_MINUTE_OPTIONS : COARSE_MINUTE_OPTIONS;
	const markEndTouched = { onChange: () => setIsEndTouched(true) };
	const errorText = (key: keyof ScheduleFormValues) =>
		errors[key] && (
			<p id={`${id}-${key}-error`} className="text-sm text-red-700">
				{errors[key]?.message}
			</p>
		);
	const describedBy = (key: keyof ScheduleFormValues) => (errors[key] ? `${id}-${key}-error` : undefined);

	return (
		<Dialog title={TITLE_BY_MODE[mode.type]} size="md" dismissible={!isSubmitting} onClose={onClose}>
			<form onSubmit={handleSubmit(submit)} noValidate className="flex flex-col gap-3">
				{isEdit && (
					<div className="flex flex-col gap-1">
						<label htmlFor={`${id}-reason`} className="text-sm font-medium text-gray-800">
							변경 사유 <span aria-hidden="true">*</span>
						</label>
						<input
							id={`${id}-reason`}
							type="text"
							placeholder="변경 사유를 입력해주세요 (필수)"
							aria-invalid={!!errors.changeReason}
							aria-describedby={describedBy('changeReason')}
							className={INPUT_CLASS}
							{...register('changeReason')}
						/>
						{errorText('changeReason')}
					</div>
				)}
				<div className="flex flex-col gap-1">
					<label htmlFor={`${id}-title`} className="text-sm font-medium text-gray-800">
						제목
					</label>
					<input
						id={`${id}-title`}
						type="text"
						placeholder="일정 제목"
						maxLength={TITLE_MAX}
						aria-invalid={!!errors.title}
						aria-describedby={describedBy('title')}
						className={INPUT_CLASS}
						{...register('title')}
					/>
					{errorText('title')}
				</div>
				<div className="flex flex-col gap-1">
					<label htmlFor={`${id}-content`} className="text-sm font-medium text-gray-800">
						내용
					</label>
					<textarea
						id={`${id}-content`}
						rows={4}
						placeholder="세부 내용(선택)"
						className={INPUT_CLASS}
						{...register('content')}
					/>
				</div>
				<div className="flex flex-col gap-1">
					<label htmlFor={`${id}-location`} className="text-sm font-medium text-gray-800">
						장소
					</label>
					<input
						id={`${id}-location`}
						type="text"
						placeholder="장소명(예: 강남역 스터디룸)"
						className={INPUT_CLASS}
						{...register('locationName')}
					/>
				</div>
				<div className="grid gap-3 sm:grid-cols-2">
					<div>
						<DateTimeField
							legend="시작 시간"
							dateField={register('startDate')}
							hourField={register('startHour')}
							minuteField={register('startMinute')}
							minuteOptions={minuteOptions}
						/>
						{errorText('startDate')}
					</div>
					<div>
						<DateTimeField
							legend="종료 시간"
							dateField={register('endDate', markEndTouched)}
							hourField={register('endHour', markEndTouched)}
							minuteField={register('endMinute', markEndTouched)}
							minuteOptions={minuteOptions}
						/>
						{errorText('endDate')}
					</div>
				</div>
				<label className="flex items-center gap-2 text-sm text-gray-700">
					<input
						type="checkbox"
						{...register('isFineMinute', { onChange: event => toggleFineMinute(event.target.checked) })}
					/>
					분 단위 입력
				</label>
				<div className="flex flex-wrap items-center gap-2 text-sm text-gray-700">
					<label className="flex items-center gap-2">
						<input type="checkbox" {...register('hasLimit')} />
						인원 제한 적용
					</label>
					{hasLimit && (
						<>
							<label htmlFor={`${id}-max`} className="sr-only">
								최대 인원
							</label>
							<input
								id={`${id}-max`}
								type="number"
								min={1}
								aria-invalid={!!errors.maxAttendance}
								aria-describedby={describedBy('maxAttendance')}
								className={`${INPUT_CLASS} w-32`}
								{...register('maxAttendance')}
							/>
							<span>명</span>
							{errorText('maxAttendance')}
						</>
					)}
				</div>
				{showApprovalNotice && !isEdit && (
					<p className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-900 ring-1 ring-amber-200">
						이 그룹에서는 일정 등록 후 관리자 승인이 필요합니다.
					</p>
				)}
				<div className="flex justify-end">
					<Button type="submit" disabled={isSubmitting}>
						{isSubmitting ? '저장 중…' : '저장'}
					</Button>
				</div>
			</form>
		</Dialog>
	);
};

import { useQuery } from '@tanstack/react-query';
import { useId, useState } from 'react';
import { Button } from '@/components/common/atoms/Button';
import { EmptyMessage } from '@/components/common/atoms/EmptyMessage';
import { Dialog } from '@/components/common/organisms/Dialog';
import { Tabs } from '@/components/common/organisms/Tabs';
import type { TabItem } from '@/components/common/organisms/Tabs';
import { ModalType } from '@/constants';
import { useModalStore } from '@/modules/stores/client/modal';
import {
	ATTENDEE_DECISION,
	useDecideAttendee,
	useSaveAttendanceChecks,
} from '@/modules/stores/server/attendance/mutations';
import type { AttendeeDecision } from '@/modules/stores/server/attendance/mutations';
import { attendanceQueries } from '@/modules/stores/server/attendance/queries';
import type { GroupViewer } from '@/types/GroupDetail';
import { ACTUAL_STATUS, ATTENDANCE_STATUS } from '@/types/Schedule';
import type { ActualStatus, Attendee, AttendanceStatus, Schedule } from '@/types/Schedule';
import { cn } from '@/utils';
import { formatDateTime } from '@/utils/date';
import { canManageAttendees, STATUS_TONE_CLASS } from '@/utils/schedule';

const HISTORY_STATUS_LABEL = {
	PENDING: '신청',
	CONFIRMED: '승인',
	REJECTED: '거부',
	CANCELLED: '취소',
} as const satisfies Record<AttendanceStatus, string>;

const isHistoryFilter = (value: string): value is AttendanceStatus | '' =>
	value === '' || Object.keys(HISTORY_STATUS_LABEL).includes(value);

const ACTUAL_LABEL = { NONE: '미체크', ATTENDED: '참석', NOSHOW: '불참' } as const satisfies Record<
	ActualStatus,
	string
>;

const UNKNOWN_NAME = '(알 수 없음)';
const nameOf = (attendee: Pick<Attendee, 'displayName'>): string => attendee.displayName || UNKNOWN_NAME;

interface ManageProps {
	groupId: number;
	schedule: Schedule;
	viewer: GroupViewer;
}

/** "신청" 탭의 한 줄: 승인 대기 → 승인/거부, 확정 → (일정 관리자만) 취소 */
interface ApplyRowProps extends ManageProps {
	attendee: Attendee;
}

const ApplyRow = (props: ApplyRowProps) => {
	const { groupId, schedule, viewer, attendee } = props;
	const openModal = useModalStore(state => state.actions.openModal);
	const { mutate: decide, isPending } = useDecideAttendee(groupId);
	const name = nameOf(attendee);
	const run = (decision: AttendeeDecision) => decide({ scheduleId: schedule.id, userKey: attendee.userKey, decision });
	const confirmThen = (message: string, confirmLabel: string, decision: AttendeeDecision) =>
		openModal({ type: ModalType.CONFIRM, message, confirmLabel, onConfirm: () => run(decision) });
	const canDecide = canManageAttendees(schedule, viewer) && attendee.status === ATTENDANCE_STATUS.PENDING;
	// 강제 취소는 승인/거부보다 좁은 권한: 일정 작성자 단독으로는 불가
	const canForceCancel = viewer.canManageSchedule && attendee.status === ATTENDANCE_STATUS.CONFIRMED;

	return (
		<li className="flex flex-wrap items-center gap-2 py-1 text-sm">
			<span>{name}</span>
			{/* 처리 중에는 같은 대상에 모순된 요청(승인 중 거부 등)이 나가지 않게 버튼을 막는다 */}
			{canDecide && (
				<span className="ml-auto flex gap-1">
					<Button
						className="px-2 py-1 text-xs"
						disabled={isPending}
						aria-label={`${name} 참가 승인`}
						onClick={() => run(ATTENDEE_DECISION.APPROVE)}
					>
						승인
					</Button>
					<Button
						variant="danger"
						className="px-2 py-1 text-xs"
						disabled={isPending}
						aria-label={`${name} 참가 거부`}
						onClick={() => confirmThen('참가를 거부하시겠습니까?', '거부', ATTENDEE_DECISION.REJECT)}
					>
						거부
					</Button>
				</span>
			)}
			{canForceCancel && (
				<Button
					variant="secondary"
					className="ml-auto px-2 py-1 text-xs text-red-700"
					disabled={isPending}
					aria-label={`${name} 참가 취소`}
					onClick={() => confirmThen('이 참가자의 참가를 취소하시겠습니까?', '참가 취소', ATTENDEE_DECISION.CANCEL)}
				>
					취소
				</Button>
			)}
		</li>
	);
};

interface HistoryViewProps {
	groupId: number;
	scheduleId: number;
	onBack: () => void;
}

const HistoryView = (props: HistoryViewProps) => {
	const { groupId, scheduleId, onBack } = props;
	const statusId = useId();
	const targetId = useId();
	const [status, setStatus] = useState<AttendanceStatus | ''>('');
	const [target, setTarget] = useState('');
	const { data: history, isError } = useQuery({ ...attendanceQueries.history({ groupId, scheduleId }) });

	const renderBody = () => {
		if (isError) return <EmptyMessage message="이력을 불러오지 못했습니다." />;
		if (!history) return <EmptyMessage message="불러오는 중..." />;
		if (history.length === 0) return <EmptyMessage message="이력이 없습니다." />;
		const targets = [...new Set(history.map(nameOf))];
		const rows = history.filter(item => (!status || item.status === status) && (!target || nameOf(item) === target));
		return (
			<>
				<div className="mb-2 flex flex-wrap gap-2 text-xs">
					<label htmlFor={statusId} className="sr-only">
						상태
					</label>
					<select
						id={statusId}
						value={status}
						onChange={event => {
							const value = event.target.value;
							setStatus(isHistoryFilter(value) ? value : '');
						}}
						className="rounded-md border border-gray-300 px-2 py-1"
					>
						<option value="">상태 전체</option>
						{Object.entries(HISTORY_STATUS_LABEL).map(([value, label]) => (
							<option key={value} value={value}>
								{label}
							</option>
						))}
					</select>
					<label htmlFor={targetId} className="sr-only">
						대상
					</label>
					<select
						id={targetId}
						value={target}
						onChange={event => setTarget(event.target.value)}
						className="rounded-md border border-gray-300 px-2 py-1"
					>
						<option value="">대상 전체</option>
						{targets.map(name => (
							<option key={name} value={name}>
								{name}
							</option>
						))}
					</select>
				</div>
				<div className="max-h-80 overflow-y-auto rounded-lg ring-1 ring-gray-100">
					<table className="w-full text-xs">
						<caption className="sr-only">참가 신청 이력</caption>
						<thead className="sticky top-0 bg-white">
							<tr className="border-b border-gray-200 text-left">
								<th scope="col" className="px-2 py-1.5">
									시각
								</th>
								<th scope="col" className="px-2 py-1.5">
									상태
								</th>
								<th scope="col" className="px-2 py-1.5">
									대상
								</th>
								<th scope="col" className="px-2 py-1.5">
									처리자
								</th>
							</tr>
						</thead>
						<tbody>
							{rows.length === 0 ? (
								<tr>
									<td colSpan={4} className="py-3 text-center text-gray-400">
										조건에 맞는 이력이 없습니다.
									</td>
								</tr>
							) : (
								rows.map(item => (
									<tr key={item.attendanceId} className="border-b border-gray-100">
										<td className="px-2 py-1 whitespace-nowrap text-gray-500">{formatDateTime(item.createdAt)}</td>
										<td className="px-2 py-1">
											<span className={cn('rounded-full px-2 font-semibold', STATUS_TONE_CLASS[item.status])}>
												{HISTORY_STATUS_LABEL[item.status]}
											</span>
										</td>
										<td className="px-2 py-1">{nameOf(item)}</td>
										<td className="px-2 py-1 text-gray-500">{item.actorDisplayName || '-'}</td>
									</tr>
								))
							)}
						</tbody>
					</table>
				</div>
			</>
		);
	};

	return (
		<div>
			<button type="button" onClick={onBack} className="mb-2 text-xs font-semibold text-brand-700 hover:underline">
				← 신청 목록
			</button>
			{renderBody()}
		</div>
	);
};

const ApplyTab = (props: ManageProps) => {
	const { groupId, schedule } = props;
	const [showHistory, setShowHistory] = useState(false);
	const { data: attendees, isError } = useQuery({
		...attendanceQueries.attendees({ groupId, scheduleId: schedule.id }),
	});

	if (showHistory)
		return <HistoryView groupId={groupId} scheduleId={schedule.id} onBack={() => setShowHistory(false)} />;
	if (isError) return <EmptyMessage message="참가자 정보를 불러오지 못했습니다." />;
	if (!attendees) return <EmptyMessage message="불러오는 중..." />;
	const pending = attendees.filter(attendee => attendee.status === ATTENDANCE_STATUS.PENDING);
	const confirmed = attendees.filter(attendee => attendee.status === ATTENDANCE_STATUS.CONFIRMED);

	return (
		<div className="flex flex-col gap-2">
			<button
				type="button"
				onClick={() => setShowHistory(true)}
				className="self-end text-xs font-semibold text-brand-700 hover:underline"
			>
				이력보기
			</button>
			{pending.length === 0 && confirmed.length === 0 && <EmptyMessage message="참가자가 없습니다." />}
			{[
				{ title: '승인 대기', tone: 'text-yellow-800', rows: pending },
				{ title: '승인 완료', tone: 'text-green-800', rows: confirmed },
			]
				.filter(section => section.rows.length > 0)
				.map(section => (
					<section key={section.title} aria-label={section.title}>
						<h3 className={cn('text-xs font-bold', section.tone)}>{section.title}</h3>
						<ul>
							{section.rows.map(attendee => (
								<ApplyRow key={attendee.userKey} {...props} attendee={attendee} />
							))}
						</ul>
					</section>
				))}
		</div>
	);
};

const summaryText = (total: number, counts: Record<ActualStatus, number>): string =>
	`참가자 ${total}명 / 참석 ${counts.ATTENDED}명 / 불참 ${counts.NOSHOW}명 / 체크누락 ${counts.NONE}명`;

const countByActual = (statuses: readonly ActualStatus[]): Record<ActualStatus, number> => ({
	NONE: statuses.filter(status => status === ACTUAL_STATUS.NONE).length,
	ATTENDED: statuses.filter(status => status === ACTUAL_STATUS.ATTENDED).length,
	NOSHOW: statuses.filter(status => status === ACTUAL_STATUS.NOSHOW).length,
});

type CheckChoice = typeof ACTUAL_STATUS.ATTENDED | typeof ACTUAL_STATUS.NOSHOW;

interface CheckEditorProps extends ManageProps {
	confirmed: readonly Attendee[];
	onDone: () => void;
}

const CheckEditor = (props: CheckEditorProps) => {
	const { groupId, schedule, confirmed, onDone } = props;
	const openModal = useModalStore(state => state.actions.openModal);
	const { mutate: save, isPending } = useSaveAttendanceChecks(groupId);
	// 체크 전(NONE)인 참가자는 참석으로 시작한다(기존 화면과 같음)
	const [choices, setChoices] = useState<Record<number, CheckChoice>>(() =>
		Object.fromEntries(
			confirmed.map(attendee => [
				attendee.userKey,
				attendee.actualStatus === ACTUAL_STATUS.NOSHOW ? ACTUAL_STATUS.NOSHOW : ACTUAL_STATUS.ATTENDED,
			]),
		),
	);
	const setAll = (choice: CheckChoice) =>
		setChoices(Object.fromEntries(confirmed.map(attendee => [attendee.userKey, choice])));

	const submit = () => {
		const changes = confirmed
			.map(attendee => ({
				userKey: attendee.userKey,
				actualStatus: choices[attendee.userKey] ?? ACTUAL_STATUS.ATTENDED,
				before: attendee.actualStatus,
			}))
			.filter(change => change.actualStatus !== change.before)
			.map(({ userKey, actualStatus }) => ({ userKey, actualStatus }));
		if (changes.length === 0) {
			onDone();
			return;
		}
		save(
			{ scheduleId: schedule.id, changes },
			{
				onSuccess: ({ failedUserKeys }) => {
					onDone();
					if (failedUserKeys.length === 0) return;
					const names = confirmed.filter(attendee => failedUserKeys.includes(attendee.userKey)).map(nameOf);
					openModal({
						type: ModalType.ALERT,
						message: `다음 인원 저장에 실패했습니다: ${names.join(', ')}\n나머지 인원은 정상 저장되었습니다. 실패한 인원만 다시 시도해주세요.`,
					});
				},
			},
		);
	};

	return (
		<div className="flex flex-col gap-2 text-sm">
			<p role="status" className="text-xs text-gray-600">
				{summaryText(confirmed.length, countByActual(Object.values(choices)))}
			</p>
			<div className="flex justify-end gap-1">
				<Button variant="secondary" className="px-2 py-1 text-xs" onClick={() => setAll(ACTUAL_STATUS.ATTENDED)}>
					전체 참석
				</Button>
				<Button variant="secondary" className="px-2 py-1 text-xs" onClick={() => setAll(ACTUAL_STATUS.NOSHOW)}>
					전체 불참
				</Button>
			</div>
			<table className="w-full">
				<caption className="sr-only">참석 체크</caption>
				<thead>
					<tr className="border-b border-gray-200">
						<th scope="col" className="py-1 text-left">
							이름
						</th>
						<th scope="col" className="py-1">
							참석
						</th>
						<th scope="col" className="py-1">
							불참
						</th>
					</tr>
				</thead>
				<tbody>
					{confirmed.map(attendee => (
						<tr key={attendee.userKey} className="border-b border-gray-100">
							<td className="py-1">{nameOf(attendee)}</td>
							{([ACTUAL_STATUS.ATTENDED, ACTUAL_STATUS.NOSHOW] as const).map(choice => (
								<td key={choice} className="py-1 text-center">
									<input
										type="radio"
										name={`attendance-${attendee.userKey}`}
										aria-label={`${nameOf(attendee)} ${ACTUAL_LABEL[choice]}`}
										checked={choices[attendee.userKey] === choice}
										onChange={() => setChoices(prev => ({ ...prev, [attendee.userKey]: choice }))}
									/>
								</td>
							))}
						</tr>
					))}
				</tbody>
			</table>
			<div className="mt-2 flex justify-end gap-2">
				<Button variant="secondary" disabled={isPending} onClick={onDone}>
					취소
				</Button>
				<Button disabled={isPending} onClick={submit}>
					{isPending ? '저장 중…' : '저장'}
				</Button>
			</div>
		</div>
	);
};

const CheckTab = (props: ManageProps) => {
	const { groupId, schedule, viewer } = props;
	const [isEditing, setIsEditing] = useState(false);
	const [now] = useState(() => Date.now());
	const { data: attendees, isError } = useQuery({
		...attendanceQueries.attendees({ groupId, scheduleId: schedule.id }),
	});
	const canManage = canManageAttendees(schedule, viewer);
	// 참석 체크는 일정이 시작된 뒤부터
	const canEdit = canManage && now >= schedule.start;

	if (isError) return <EmptyMessage message="참석확인 정보를 불러오지 못했습니다." />;
	if (!attendees) return <EmptyMessage message="불러오는 중..." />;
	const confirmed = attendees.filter(attendee => attendee.status === ATTENDANCE_STATUS.CONFIRMED);
	if (isEditing) return <CheckEditor {...props} confirmed={confirmed} onDone={() => setIsEditing(false)} />;

	const byActual = (status: ActualStatus) =>
		confirmed.filter(attendee => (attendee.actualStatus ?? ACTUAL_STATUS.NONE) === status);

	return (
		<div className="flex flex-col gap-2 text-sm">
			<div className="flex items-center justify-end gap-2">
				{!canEdit && canManage && (
					<p className="mr-auto text-xs text-gray-400">일정 시작 이후부터 참석 등록이 가능합니다.</p>
				)}
				<Button
					variant="secondary"
					className="px-3 py-1 text-xs"
					disabled={!canEdit}
					onClick={() => setIsEditing(true)}
				>
					수정
				</Button>
			</div>
			{canManage &&
				(confirmed.length === 0 ? (
					<EmptyMessage message="확정된 참가자가 없습니다." />
				) : (
					<>
						<p role="status" className="text-xs text-gray-600">
							{summaryText(
								confirmed.length,
								countByActual(confirmed.map(attendee => attendee.actualStatus ?? ACTUAL_STATUS.NONE)),
							)}
						</p>
						{([ACTUAL_STATUS.NONE, ACTUAL_STATUS.ATTENDED, ACTUAL_STATUS.NOSHOW] as const)
							.filter(status => byActual(status).length > 0)
							.map(status => (
								<section key={status} aria-label={ACTUAL_LABEL[status]}>
									<h3 className="mt-2 text-xs font-bold text-gray-600">{ACTUAL_LABEL[status]}</h3>
									<ul>
										{byActual(status).map(attendee => (
											<li key={attendee.userKey}>{nameOf(attendee)}</li>
										))}
									</ul>
								</section>
							))}
					</>
				))}
		</div>
	);
};

const TAB_KEYS = ['apply', 'check'] as const;
type TabKey = (typeof TAB_KEYS)[number];

interface AttendeeManageDialogProps extends ManageProps {
	onClose: () => void;
}

export const AttendeeManageDialog = (props: AttendeeManageDialogProps) => {
	const { onClose, ...manageProps } = props;
	const [tab, setTab] = useState<TabKey>('apply');
	const tabs: readonly TabItem<TabKey>[] = [
		{ key: 'apply', label: '신청', render: () => <ApplyTab {...manageProps} /> },
		{ key: 'check', label: '참석확인', render: () => <CheckTab {...manageProps} /> },
	];

	return (
		<Dialog title="참가자 관리" size="md" onClose={onClose}>
			<Tabs label="참가자 관리 메뉴" tabs={tabs} selected={tab} onSelect={setTab} />
		</Dialog>
	);
};

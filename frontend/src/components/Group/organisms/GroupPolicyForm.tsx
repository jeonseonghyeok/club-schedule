import { useId } from 'react';
import type { ReactNode } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/common/atoms/Button';
import { ModalType } from '@/constants';
import { useModalStore } from '@/modules/stores/client/modal';
import { useUpdateGroupPolicy } from '@/modules/stores/server/group/mutations';
import { VISIBILITY_TYPE } from '@/types/GroupDetail';
import type { VisibilityType } from '@/types/GroupDetail';
import type { GroupPolicy } from '@/types/GroupSettings';
import { GROUP_ROLE } from '@/types/Member';

/**
 * 일반회원의 일정 등록 가능 여부. 백엔드는 min_role_to_create 가 LEADER 든 MANAGER 든
 * 일반회원만 막고(매니저는 항상 등록 가능) 동작이 같으므로 화면에서는 두 가지로만 고른다.
 */
const CREATE_SCOPE = { ALL: GROUP_ROLE.MEMBER, MANAGERS: GROUP_ROLE.MANAGER } as const;
type CreateScope = (typeof CREATE_SCOPE)[keyof typeof CREATE_SCOPE];

const CREATE_SCOPE_OPTIONS = [
	{ value: CREATE_SCOPE.ALL, label: '모든 회원' },
	{ value: CREATE_SCOPE.MANAGERS, label: '리더·매니저만' },
] as const satisfies readonly { value: CreateScope; label: string }[];

const VISIBILITY_OPTIONS = [
	{ value: VISIBILITY_TYPE.PUBLIC, label: '전체 공개', description: '비회원도 확정된 앞으로의 일정을 모두 봅니다.' },
	{
		value: VISIBILITY_TYPE.PARTIAL,
		label: '일부 공개',
		description: '비회원에게는 가까운 일정만 보입니다(3일 이내 일정, 최소 3건).',
	},
	{ value: VISIBILITY_TYPE.PRIVATE, label: '비공개', description: '회원만 일정을 봅니다.' },
] as const satisfies readonly { value: VisibilityType; label: string; description: string }[];

interface PolicyFormValues {
	readonly createScope: CreateScope;
	readonly requiresApproval: boolean;
	readonly defManagerCanManageSchedule: boolean;
	readonly requiresAttendanceApproval: boolean;
	readonly visibilityType: VisibilityType;
}

const toFormValues = (policy: GroupPolicy): PolicyFormValues => ({
	createScope: policy.minRoleToCreate === GROUP_ROLE.MEMBER ? CREATE_SCOPE.ALL : CREATE_SCOPE.MANAGERS,
	requiresApproval: policy.requiresApproval,
	defManagerCanManageSchedule: policy.defManagerCanManageSchedule,
	requiresAttendanceApproval: policy.requiresAttendanceApproval,
	visibilityType: policy.visibilityType,
});

const toPolicy = (values: PolicyFormValues): GroupPolicy => ({
	minRoleToCreate: values.createScope,
	requiresApproval: values.requiresApproval,
	defManagerCanManageSchedule: values.defManagerCanManageSchedule,
	requiresAttendanceApproval: values.requiresAttendanceApproval,
	visibilityType: values.visibilityType,
});

interface Props {
	groupId: number;
	policy: GroupPolicy;
	/** 리더만 바꿀 수 있다 — 매니저에게는 읽기 전용으로 보여준다 */
	canEdit: boolean;
}

interface CheckboxFieldProps {
	label: string;
	description: string;
	children: ReactNode;
}

const CheckboxField = (props: CheckboxFieldProps) => (
	<label className="flex items-start gap-2 text-sm text-gray-800">
		{props.children}
		<span>
			{props.label}
			<span className="block text-xs text-gray-500">{props.description}</span>
		</span>
	</label>
);

/** 일정·참가 운영 정책 — 실제 권한 판단(group_schedule_policy)에 쓰인다 */
export const GroupPolicyForm = (props: Props) => {
	const { groupId, policy, canEdit } = props;
	const scopeId = useId();
	const openModal = useModalStore(state => state.actions.openModal);
	const { mutate: save, isPending } = useUpdateGroupPolicy(groupId);
	const {
		register,
		handleSubmit,
		reset,
		formState: { isDirty },
	} = useForm<PolicyFormValues>({ defaultValues: toFormValues(policy) });

	const submit = (values: PolicyFormValues) =>
		save(toPolicy(values), {
			onSuccess: saved => {
				reset(toFormValues(saved.policy));
				openModal({ type: ModalType.ALERT, message: '운영 정책이 저장되었습니다.' });
			},
		});

	return (
		<form onSubmit={handleSubmit(submit)} className="flex flex-col gap-4">
			{!canEdit && (
				<p className="rounded-md bg-gray-50 px-3 py-2 text-sm text-gray-600">운영 정책은 리더만 바꿀 수 있습니다.</p>
			)}
			<fieldset disabled={!canEdit || isPending} className="flex flex-col gap-4">
				<legend className="sr-only">일정·참가 운영 정책</legend>
				<div className="flex flex-col gap-1">
					<label htmlFor={scopeId} className="text-sm font-medium text-gray-800">
						일정 등록
					</label>
					<select
						id={scopeId}
						className="w-48 rounded-md border border-gray-300 px-3 py-2"
						{...register('createScope')}
					>
						{CREATE_SCOPE_OPTIONS.map(option => (
							<option key={option.value} value={option.value}>
								{option.label}
							</option>
						))}
					</select>
					<p className="text-xs text-gray-500">
						매니저가 등록한 일정은 일정관리자 권한이 없으면 승인 대기로 올라갑니다.
					</p>
				</div>
				<CheckboxField label="일반회원 일정은 승인 후 확정" description="모든 회원이 등록할 수 있을 때만 적용됩니다.">
					<input type="checkbox" className="mt-1" {...register('requiresApproval')} />
				</CheckboxField>
				<CheckboxField
					label="매니저 기본 일정 관리 권한"
					description="개별 권한을 주지 않은 매니저도 일정 승인·수정·취소, 참가 승인·참석 체크를 할 수 있습니다."
				>
					<input type="checkbox" className="mt-1" {...register('defManagerCanManageSchedule')} />
				</CheckboxField>
				<CheckboxField
					label="참가 신청은 승인 후 확정"
					description="일반회원의 참가 신청을 일정 등록자나 매니저가 승인합니다."
				>
					<input type="checkbox" className="mt-1" {...register('requiresAttendanceApproval')} />
				</CheckboxField>
				<fieldset className="flex flex-col gap-2">
					<legend className="mb-1 text-sm font-medium text-gray-800">비회원 일정 공개 범위</legend>
					{VISIBILITY_OPTIONS.map(option => (
						<label key={option.value} className="flex items-start gap-2 text-sm text-gray-800">
							<input type="radio" value={option.value} className="mt-1" {...register('visibilityType')} />
							<span>
								{option.label}
								<span className="block text-xs text-gray-500">{option.description}</span>
							</span>
						</label>
					))}
				</fieldset>
			</fieldset>
			{canEdit && (
				<div className="flex justify-end">
					<Button type="submit" disabled={isPending || !isDirty}>
						{isPending ? '저장 중…' : '운영 정책 저장'}
					</Button>
				</div>
			)}
		</form>
	);
};

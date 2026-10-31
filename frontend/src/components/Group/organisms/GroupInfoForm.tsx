import { zodResolver } from '@hookform/resolvers/zod';
import { useId } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/common/atoms/Button';
import { ModalType } from '@/constants';
import { useModalStore } from '@/modules/stores/client/modal';
import { useUpdateGroupInfo } from '@/modules/stores/server/group/mutations';
import type { GroupInfoPayload, GroupSettings } from '@/types/GroupSettings';

// 백엔드 GroupUpdateDto 의 검증과 같은 제한
const GROUP_NAME_MAX = 100;
const DESCRIPTION_MAX = 5000;
const CAPACITY_MAX = 1000;

const INPUT_CLASS =
	'rounded-md border border-gray-300 px-3 py-2 focus-visible:outline-2 focus-visible:outline-gray-900 aria-invalid:border-red-600';

/** 정원은 지금 활동 중인 회원 수보다 작게 줄일 수 없다 */
const buildSchema = (activeMemberCount: number) =>
	z.object({
		name: z
			.string()
			.trim()
			.min(1, '모임 이름을 입력하세요.')
			.max(GROUP_NAME_MAX, `모임 이름은 최대 ${GROUP_NAME_MAX}자까지 입력 가능합니다.`),
		description: z.string().trim().max(DESCRIPTION_MAX, '모임 설명은 너무 깁니다.'),
		capacity: z
			.number({ message: '정원을 숫자로 입력하세요.' })
			.int('정원은 정수로 입력하세요.')
			.min(Math.max(1, activeMemberCount), `현재 회원 수(${activeMemberCount}명)보다 작게 할 수 없습니다.`)
			.max(CAPACITY_MAX, `정원은 최대 ${CAPACITY_MAX}명까지 허용됩니다.`),
		autoApprove: z.boolean(),
		allowSelfNickname: z.boolean(),
	});

// 모임 닉네임 관리 방식 — 기본은 모임장·매니저가 관리(allow_self_nickname=0)
const NICKNAME_POLICY_OPTIONS = [
	{ allowSelf: false, label: '모임장이 관리', help: '모임장·매니저가 회원 정보에서 회원의 모임 닉네임을 정합니다.' },
	{
		allowSelf: true,
		label: '회원이 직접 수정',
		help: '회원이 자기 모임 닉네임을 바꿀 수 있습니다. 모임장·매니저도 바꿀 수 있습니다.',
	},
] as const;

const toFormValues = (settings: GroupSettings): GroupInfoPayload => ({
	name: settings.name,
	description: settings.description ?? '',
	capacity: settings.capacity,
	autoApprove: settings.autoApprove,
	allowSelfNickname: settings.allowSelfNickname,
});

interface Props {
	groupId: number;
	settings: GroupSettings;
}

/** 모임 기본 정보 — 리더·매니저 */
export const GroupInfoForm = (props: Props) => {
	const { groupId, settings } = props;
	const nameId = useId();
	const descriptionId = useId();
	const capacityId = useId();
	const capacityHelpId = useId();
	const openModal = useModalStore(state => state.actions.openModal);
	const { mutate: save, isPending } = useUpdateGroupInfo(groupId);
	const {
		register,
		control,
		handleSubmit,
		reset,
		formState: { errors, isDirty },
	} = useForm<GroupInfoPayload>({
		resolver: zodResolver(buildSchema(settings.activeMemberCount)),
		defaultValues: toFormValues(settings),
	});

	const submit = (values: GroupInfoPayload) =>
		save(values, {
			onSuccess: saved => {
				reset(toFormValues(saved));
				openModal({ type: ModalType.ALERT, message: '모임 정보가 저장되었습니다.' });
			},
		});

	return (
		<form onSubmit={handleSubmit(submit)} noValidate className="flex flex-col gap-4">
			<div className="flex flex-col gap-1">
				<label htmlFor={nameId} className="text-sm font-medium text-gray-800">
					모임 이름
				</label>
				<input
					id={nameId}
					type="text"
					maxLength={GROUP_NAME_MAX}
					aria-invalid={!!errors.name}
					aria-describedby={errors.name ? `${nameId}-error` : undefined}
					className={INPUT_CLASS}
					{...register('name')}
				/>
				{errors.name && (
					<p id={`${nameId}-error`} className="text-sm text-red-700">
						{errors.name.message}
					</p>
				)}
			</div>
			<div className="flex flex-col gap-1">
				<label htmlFor={descriptionId} className="text-sm font-medium text-gray-800">
					모임 설명
				</label>
				<textarea
					id={descriptionId}
					rows={5}
					maxLength={DESCRIPTION_MAX}
					aria-invalid={!!errors.description}
					aria-describedby={errors.description ? `${descriptionId}-error` : undefined}
					className={INPUT_CLASS}
					{...register('description')}
				/>
				{errors.description && (
					<p id={`${descriptionId}-error`} className="text-sm text-red-700">
						{errors.description.message}
					</p>
				)}
			</div>
			<div className="flex flex-col gap-1">
				<label htmlFor={capacityId} className="text-sm font-medium text-gray-800">
					정원
				</label>
				<input
					id={capacityId}
					type="number"
					inputMode="numeric"
					min={1}
					max={CAPACITY_MAX}
					aria-invalid={!!errors.capacity}
					aria-describedby={capacityHelpId}
					className={`${INPUT_CLASS} w-32`}
					{...register('capacity', { valueAsNumber: true })}
				/>
				<p id={capacityHelpId} className={errors.capacity ? 'text-sm text-red-700' : 'text-xs text-gray-500'}>
					{errors.capacity?.message ?? `현재 활동 회원 ${settings.activeMemberCount}명`}
				</p>
			</div>
			<label className="flex items-start gap-2 text-sm text-gray-800">
				<input type="checkbox" className="mt-1" {...register('autoApprove')} />
				<span>
					가입 신청 자동 승인
					<span className="block text-xs text-gray-500">
						켜면 정원 안에서 가입 신청이 바로 승인됩니다. 정원이 차면 리더가 직접 처리합니다.
					</span>
				</span>
			</label>
			<Controller
				control={control}
				name="allowSelfNickname"
				render={({ field }) => (
					<fieldset className="flex flex-col gap-2">
						<legend className="mb-1 text-sm font-medium text-gray-800">모임 닉네임 관리</legend>
						{NICKNAME_POLICY_OPTIONS.map(option => (
							<label key={option.label} className="flex items-start gap-2 text-sm text-gray-800">
								<input
									type="radio"
									name={field.name}
									className="mt-1"
									checked={field.value === option.allowSelf}
									onChange={() => field.onChange(option.allowSelf)}
									onBlur={field.onBlur}
								/>
								<span>
									{option.label}
									<span className="block text-xs text-gray-500">{option.help}</span>
								</span>
							</label>
						))}
					</fieldset>
				)}
			/>
			<div className="flex justify-end">
				<Button type="submit" disabled={isPending || !isDirty}>
					{isPending ? '저장 중…' : '기본 정보 저장'}
				</Button>
			</div>
		</form>
	);
};

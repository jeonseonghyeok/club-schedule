import { zodResolver } from '@hookform/resolvers/zod';
import { useId } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/common/atoms/Button';
import { Dialog } from '@/components/common/organisms/Dialog';
import type { GroupRequestCreatePayload } from '@/types/GroupRequest';

// 백엔드 GroupRequestDto 의 검증과 같은 제한
const GROUP_NAME_MAX = 100;
const DESCRIPTION_MAX = 5000;

const createSchema = z.object({
	groupName: z
		.string()
		.trim()
		.min(1, '모임 이름을 입력하세요.')
		.max(GROUP_NAME_MAX, `모임 이름은 최대 ${GROUP_NAME_MAX}자까지 입력 가능합니다.`),
	description: z.string().trim().max(DESCRIPTION_MAX, '모임 설명은 너무 깁니다.'),
});

interface Props {
	isSubmitting: boolean;
	onSubmit: (payload: GroupRequestCreatePayload) => void;
	onClose: () => void;
}

export const GroupRequestCreateDialog = (props: Props) => {
	const { isSubmitting, onSubmit, onClose } = props;
	const nameId = useId();
	const nameErrorId = useId();
	const descriptionId = useId();
	const descriptionErrorId = useId();
	const {
		register,
		handleSubmit,
		formState: { errors },
	} = useForm<GroupRequestCreatePayload>({
		resolver: zodResolver(createSchema),
		defaultValues: { groupName: '', description: '' },
	});

	return (
		<Dialog title="신청하기" size="md" onClose={onClose}>
			<form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
				<div className="flex flex-col gap-1">
					<label htmlFor={nameId} className="text-sm font-medium text-gray-800">
						모임 이름
					</label>
					<input
						id={nameId}
						type="text"
						maxLength={GROUP_NAME_MAX}
						aria-invalid={!!errors.groupName}
						aria-describedby={errors.groupName ? nameErrorId : undefined}
						className="rounded-md border border-gray-300 px-3 py-2 focus-visible:outline-2 focus-visible:outline-gray-900 aria-invalid:border-red-600"
						{...register('groupName')}
					/>
					{errors.groupName && (
						<p id={nameErrorId} className="text-sm text-red-700">
							{errors.groupName.message}
						</p>
					)}
				</div>
				<div className="flex flex-col gap-1">
					<label htmlFor={descriptionId} className="text-sm font-medium text-gray-800">
						설명
					</label>
					<textarea
						id={descriptionId}
						rows={6}
						maxLength={DESCRIPTION_MAX}
						aria-invalid={!!errors.description}
						aria-describedby={errors.description ? descriptionErrorId : undefined}
						className="rounded-md border border-gray-300 px-3 py-2 focus-visible:outline-2 focus-visible:outline-gray-900 aria-invalid:border-red-600"
						{...register('description')}
					/>
					{errors.description && (
						<p id={descriptionErrorId} className="text-sm text-red-700">
							{errors.description.message}
						</p>
					)}
				</div>
				<div className="flex justify-end gap-2">
					<Button variant="secondary" onClick={onClose}>
						취소
					</Button>
					<Button type="submit" disabled={isSubmitting}>
						{isSubmitting ? '신청 중…' : '신청하기'}
					</Button>
				</div>
			</form>
		</Dialog>
	);
};

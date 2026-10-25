import { zodResolver } from '@hookform/resolvers/zod';
import { useId } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/common/atoms/Button';
import { Dialog } from '@/components/common/organisms/Dialog';

const CUSTOM_REASON = '기타';
const REASON_MAX = 500;

interface RejectFormValues {
	preset: string;
	custom: string;
}

interface Props {
	title: string;
	/** 있으면 선택지 + "기타(직접 입력)", 없으면 자유 입력만 */
	presets?: readonly string[];
	/** true 면 사유가 반드시 있어야 한다 */
	isReasonRequired: boolean;
	/** 확정 버튼 문구(기본 "거부 확정") */
	confirmLabel?: string;
	/** 사유 입력란 이름(기본 "거부 사유") */
	reasonLabel?: string;
	isSubmitting: boolean;
	onSubmit: (reason: string) => void;
	onClose: () => void;
}

const buildSchema = (params: { hasPresets: boolean; isReasonRequired: boolean; reasonLabel: string }) =>
	z
		.object({
			preset: z.string(),
			custom: z.string().trim().max(REASON_MAX, `사유는 ${REASON_MAX}자까지 입력할 수 있습니다.`),
		})
		.superRefine((values, context) => {
			const needsCustom = !params.hasPresets || values.preset === CUSTOM_REASON;
			if (needsCustom && params.isReasonRequired && !values.custom) {
				context.addIssue({ code: 'custom', path: ['custom'], message: `${params.reasonLabel}를 입력하세요.` });
			}
		});

export const ReasonDialog = (props: Props) => {
	const {
		title,
		presets,
		isReasonRequired,
		confirmLabel = '거부 확정',
		reasonLabel = '거부 사유',
		isSubmitting,
		onSubmit,
		onClose,
	} = props;
	const hasPresets = !!presets && presets.length > 0;
	const presetId = useId();
	const customId = useId();
	const customErrorId = useId();
	const {
		register,
		handleSubmit,
		control,
		formState: { errors },
	} = useForm<RejectFormValues>({
		resolver: zodResolver(buildSchema({ hasPresets, isReasonRequired, reasonLabel })),
		defaultValues: { preset: presets?.[0] ?? '', custom: '' },
	});
	// watch() 는 React Compiler 메모이제이션과 맞지 않아 useWatch 로 구독한다
	const preset = useWatch({ control, name: 'preset' });
	const showCustom = !hasPresets || preset === CUSTOM_REASON;

	const submit = (values: RejectFormValues) => onSubmit(showCustom ? values.custom.trim() : values.preset);

	return (
		<Dialog title={title} size="md" onClose={onClose}>
			<form onSubmit={handleSubmit(submit)} noValidate className="flex flex-col gap-3">
				{hasPresets && (
					<div className="flex flex-col gap-1">
						<label htmlFor={presetId} className="text-sm font-medium text-gray-800">
							{reasonLabel}
						</label>
						<select
							id={presetId}
							className="rounded-md border border-gray-300 px-3 py-2 focus-visible:outline-2 focus-visible:outline-gray-900"
							{...register('preset')}
						>
							{presets.map(preset => (
								<option key={preset} value={preset}>
									{preset}
								</option>
							))}
							<option value={CUSTOM_REASON}>기타 (직접 입력)</option>
						</select>
					</div>
				)}
				{showCustom && (
					<div className="flex flex-col gap-1">
						<label htmlFor={customId} className="text-sm font-medium text-gray-800">
							{hasPresets ? '직접 입력' : `${reasonLabel}${isReasonRequired ? '' : ' (선택)'}`}
						</label>
						<textarea
							id={customId}
							rows={3}
							maxLength={REASON_MAX}
							aria-invalid={!!errors.custom}
							aria-describedby={errors.custom ? customErrorId : undefined}
							className="rounded-md border border-gray-300 px-3 py-2 focus-visible:outline-2 focus-visible:outline-gray-900 aria-invalid:border-red-600"
							{...register('custom')}
						/>
						{errors.custom && (
							<p id={customErrorId} className="text-sm text-red-700">
								{errors.custom.message}
							</p>
						)}
					</div>
				)}
				<div className="mt-2 flex justify-end gap-2">
					<Button variant="secondary" onClick={onClose}>
						취소
					</Button>
					<Button type="submit" variant="danger" disabled={isSubmitting}>
						{isSubmitting ? '처리 중…' : confirmLabel}
					</Button>
				</div>
			</form>
		</Dialog>
	);
};

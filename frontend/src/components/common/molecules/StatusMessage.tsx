import { cn } from '@/utils';

export const STATUS_TONE = { PENDING: 'pending', SUCCESS: 'success', ERROR: 'error' } as const;
export type StatusTone = (typeof STATUS_TONE)[keyof typeof STATUS_TONE];

interface Props {
	tone: StatusTone;
	message: string;
}

const TONE_CLASS = {
	pending: 'text-gray-700',
	success: 'text-green-700',
	error: 'text-red-700',
} as const satisfies Record<StatusTone, string>;

// 색만으로 상태를 전달하지 않도록 진행 중에는 스피너, 결과는 아이콘 문자를 함께 보여준다.
const TONE_ICON = { success: '✓', error: '!' } as const satisfies Record<Exclude<StatusTone, 'pending'>, string>;

export const StatusMessage = (props: Props) => {
	const { tone, message } = props;

	return (
		<p
			role={tone === STATUS_TONE.ERROR ? 'alert' : 'status'}
			className={cn('flex items-center gap-2 text-sm', TONE_CLASS[tone])}
		>
			{tone === STATUS_TONE.PENDING ? (
				<span
					aria-hidden="true"
					className="size-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-700"
				/>
			) : (
				<span aria-hidden="true" className="font-bold">
					{TONE_ICON[tone]}
				</span>
			)}
			{message}
		</p>
	);
};

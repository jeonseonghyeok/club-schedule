import type { VisibilityType } from '@/types/GroupDetail';

const NOTICE = {
	PUBLIC: { title: '회원이 아니어도 일정을 볼 수 있어요', body: '가입하면 일정에 참가할 수 있습니다.' },
	PARTIAL: {
		title: '가까운 일정만 보여요',
		body: '비회원에게는 3일 이내 일정(최소 3건)만 보입니다. 가입하면 모든 일정을 보고 참가할 수 있어요.',
	},
	PRIVATE: { title: '회원만 일정을 볼 수 있어요', body: '가입하면 일정을 보고 참가할 수 있습니다.' },
} as const satisfies Record<VisibilityType, { title: string; body: string }>;

interface Props {
	visibilityType: VisibilityType;
}

/** 비회원에게 이 모임 일정이 어디까지 보이는지 */
export const VisibilityNotice = (props: Props) => {
	const notice = NOTICE[props.visibilityType];
	return (
		<aside className="rounded-2xl bg-amber-50 p-4 ring-1 ring-amber-200">
			<p className="font-bold text-amber-900">{notice.title}</p>
			<p className="mt-1 text-sm text-amber-800">{notice.body}</p>
		</aside>
	);
};

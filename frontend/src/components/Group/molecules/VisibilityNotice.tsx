import type { VisibilityType } from '@/types/GroupDetail';

const NOTICE = {
	PARTIAL: '비회원은 향후 일정 일부만 볼 수 있습니다.',
	PRIVATE: '비회원은 일정 정보를 볼 수 없습니다.',
	PUBLIC: '비회원도 모든 일정을 볼 수 있습니다.',
} as const satisfies Record<VisibilityType, string>;

interface Props {
	visibilityType: VisibilityType;
}

export const VisibilityNotice = (props: Props) => (
	<aside className="rounded-2xl bg-amber-50 p-4 ring-1 ring-amber-200">
		<p className="font-bold text-amber-900">이 모임은 멤버 전용입니다</p>
		<p className="mt-1 text-sm text-amber-800">{NOTICE[props.visibilityType]}</p>
	</aside>
);

import type { ReactNode } from 'react';

interface Props {
	label: string;
	children: ReactNode;
}

/** 일정 카드의 "라벨  값" 한 줄 */
export const InfoLine = (props: Props) => (
	<div className="flex gap-2 text-xs leading-relaxed">
		<span className="w-14 shrink-0 text-gray-400">{props.label}</span>
		<span className="min-w-0 truncate text-gray-700">{props.children}</span>
	</div>
);

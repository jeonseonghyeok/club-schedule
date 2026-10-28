import type { SVGProps } from 'react';

/** 24px 선 아이콘(stroke) — 앱 내비게이션·목록에서 쓰는 것만 둔다 */
const PATHS = {
	home: 'M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1v-9.5Z',
	map: 'M9 4 3 6.5v13.5l6-2.5 6 2.5 6-2.5V4l-6 2.5L9 4Zm0 0v13.5m6-11V20',
	settings:
		'M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm7.4-3.5c0-.5 0-1-.1-1.4l2-1.6-2-3.4-2.4 1a7.6 7.6 0 0 0-2.4-1.4L14 2.5h-4l-.5 2.7a7.6 7.6 0 0 0-2.4 1.4l-2.4-1-2 3.4 2 1.6a7.7 7.7 0 0 0 0 2.8l-2 1.6 2 3.4 2.4-1c.7.6 1.5 1.1 2.4 1.4l.5 2.7h4l.5-2.7c.9-.3 1.7-.8 2.4-1.4l2.4 1 2-3.4-2-1.6c.1-.4.1-.9.1-1.4Z',
	chevronLeft: 'M15 5l-7 7 7 7',
	chevronRight: 'M9 5l7 7-7 7',
	more: 'M5 12h.01M12 12h.01M19 12h.01',
	pin: 'M12 21s-7-6.1-7-11.5a7 7 0 1 1 14 0C19 14.9 12 21 12 21Zm0-9a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z',
	users:
		'M16 19v-1.5a3.5 3.5 0 0 0-3.5-3.5h-5A3.5 3.5 0 0 0 4 17.5V19m16 0v-1.5a3.5 3.5 0 0 0-2.5-3.4M14.5 4.3a3.5 3.5 0 0 1 0 6.4M13.5 7.5a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0Z',
	calendar: 'M7 3v3m10-3v3M4 9h16M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z',
	logout: 'M15 4h4a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-4M10 16l4-4-4-4m4 4H3',
	download: 'M12 4v11m0 0-4-4m4 4 4-4M5 20h14',
	plus: 'M12 5v14M5 12h14',
	search: 'M20 20l-4.5-4.5M17 10.5a6.5 6.5 0 1 1-13 0 6.5 6.5 0 0 1 13 0Z',
	user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 8a7 7 0 0 1 14 0',
	bell: 'M6 9a6 6 0 1 1 12 0c0 4.5 2 6 2 6H4s2-1.5 2-6Zm4 9a2 2 0 0 0 4 0',
} as const;

export type IconName = keyof typeof PATHS;

interface Props extends Omit<SVGProps<SVGSVGElement>, 'name'> {
	name: IconName;
	/** 픽셀 크기(기본 20) */
	size?: number;
}

/** 장식용 아이콘 — 의미는 옆 텍스트나 aria-label 이 전달한다 */
export const Icon = (props: Props) => {
	const { name, size = 20, strokeWidth = 1.8, ...rest } = props;
	return (
		<svg
			width={size}
			height={size}
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth={strokeWidth}
			strokeLinecap="round"
			strokeLinejoin="round"
			aria-hidden="true"
			focusable="false"
			{...rest}
		>
			<path d={PATHS[name]} />
		</svg>
	);
};

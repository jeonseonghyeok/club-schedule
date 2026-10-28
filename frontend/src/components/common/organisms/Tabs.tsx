import { useId, useRef } from 'react';
import type { KeyboardEvent, ReactNode } from 'react';
import { cn } from '@/utils';

export interface TabItem<K extends string> {
	readonly key: K;
	readonly label: string;
	readonly render: () => ReactNode;
}

interface Props<K extends string> {
	/** tablist 의 접근성 이름 */
	label: string;
	tabs: readonly TabItem<K>[];
	selected: K;
	onSelect: (key: K) => void;
	/** 탭 줄 오른쪽에 둘 요소(즐겨찾기·가입 버튼 등) */
	actions?: ReactNode;
	/** card: 패널을 흰 카드로 감싼다(기본) / plain: 패널 안 내용이 이미 카드들일 때 */
	panelVariant?: TabPanelVariant;
}

export const TAB_PANEL_VARIANT = { CARD: 'card', PLAIN: 'plain' } as const;
export type TabPanelVariant = (typeof TAB_PANEL_VARIANT)[keyof typeof TAB_PANEL_VARIANT];

const PANEL_CLASS = {
	card: 'rounded-2xl bg-white p-4 ring-1 ring-gray-200 sm:p-5',
	plain: 'flex flex-col gap-4',
} as const satisfies Record<TabPanelVariant, string>;

const NAVIGATION_KEYS = ['ArrowLeft', 'ArrowRight', 'Home', 'End'] as const;
type NavigationKey = (typeof NAVIGATION_KEYS)[number];
const isNavigationKey = (key: string): key is NavigationKey => NAVIGATION_KEYS.some(navigation => navigation === key);

/** WAI-ARIA 탭 패턴: 좌우 화살표·Home·End 로 이동, 선택된 탭만 Tab 순서에 들어간다 */
export const Tabs = <K extends string>(props: Props<K>) => {
	const { label, tabs, selected, onSelect, actions, panelVariant = TAB_PANEL_VARIANT.CARD } = props;
	const baseId = useId();
	const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
	const selectedIndex = Math.max(
		0,
		tabs.findIndex(tab => tab.key === selected),
	);
	const selectedTab = tabs[selectedIndex];

	const moveFocus = (event: KeyboardEvent<HTMLDivElement>) => {
		if (!isNavigationKey(event.key)) return;
		event.preventDefault();
		const last = tabs.length - 1;
		const nextIndex = {
			ArrowLeft: selectedIndex === 0 ? last : selectedIndex - 1,
			ArrowRight: selectedIndex === last ? 0 : selectedIndex + 1,
			Home: 0,
			End: last,
		}[event.key];
		const next = tabs[nextIndex];
		if (!next) return;
		onSelect(next.key);
		tabRefs.current[nextIndex]?.focus();
	};

	return (
		<>
			<div className="flex items-center justify-between gap-2">
				<div
					role="tablist"
					aria-label={label}
					onKeyDown={moveFocus}
					className="flex min-w-0 flex-1 gap-1 overflow-x-auto rounded-xl bg-gray-100 p-1 [scrollbar-width:none]"
				>
					{tabs.map((tab, index) => {
						const isSelected = tab.key === selectedTab?.key;
						return (
							<button
								key={tab.key}
								ref={element => {
									tabRefs.current[index] = element;
								}}
								type="button"
								role="tab"
								id={`${baseId}-tab-${tab.key}`}
								aria-selected={isSelected}
								aria-controls={`${baseId}-panel-${tab.key}`}
								tabIndex={isSelected ? 0 : -1}
								onClick={() => onSelect(tab.key)}
								className={cn(
									'min-h-9 flex-1 shrink-0 rounded-lg px-4 text-sm whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:outline-brand-600',
									isSelected
										? 'bg-white font-semibold text-gray-900 shadow-sm'
										: 'font-medium text-gray-500 hover:text-gray-800',
								)}
							>
								{tab.label}
							</button>
						);
					})}
				</div>
				{actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
			</div>
			{selectedTab && (
				<section
					role="tabpanel"
					id={`${baseId}-panel-${selectedTab.key}`}
					aria-labelledby={`${baseId}-tab-${selectedTab.key}`}
					className={PANEL_CLASS[panelVariant]}
				>
					{selectedTab.render()}
				</section>
			)}
		</>
	);
};

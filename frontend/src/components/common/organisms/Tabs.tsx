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
}

const NAVIGATION_KEYS = ['ArrowLeft', 'ArrowRight', 'Home', 'End'] as const;
type NavigationKey = (typeof NAVIGATION_KEYS)[number];
const isNavigationKey = (key: string): key is NavigationKey => NAVIGATION_KEYS.some(navigation => navigation === key);

/** WAI-ARIA 탭 패턴: 좌우 화살표·Home·End 로 이동, 선택된 탭만 Tab 순서에 들어간다 */
export const Tabs = <K extends string>(props: Props<K>) => {
	const { label, tabs, selected, onSelect, actions } = props;
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
			<div className="flex flex-wrap items-end justify-between gap-2 border-b border-gray-200">
				<div role="tablist" aria-label={label} onKeyDown={moveFocus} className="flex flex-wrap gap-1">
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
									'-mb-px rounded-t-md border border-b-0 px-4 py-2 text-sm focus-visible:outline-2 focus-visible:outline-gray-900',
									isSelected
										? 'border-gray-200 bg-white font-semibold text-gray-900'
										: 'border-transparent text-gray-600 hover:bg-gray-50',
								)}
							>
								{tab.label}
							</button>
						);
					})}
				</div>
				{actions && <div className="pb-1">{actions}</div>}
			</div>
			{selectedTab && (
				<section
					role="tabpanel"
					id={`${baseId}-panel-${selectedTab.key}`}
					aria-labelledby={`${baseId}-tab-${selectedTab.key}`}
					className="rounded-b-xl border border-t-0 border-gray-200 bg-white p-4"
				>
					{selectedTab.render()}
				</section>
			)}
		</>
	);
};

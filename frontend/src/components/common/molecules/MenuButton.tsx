import { useEffect, useId, useRef, useState } from 'react';
import type { ReactNode } from 'react';

export interface MenuItem {
	readonly label: string;
	readonly onSelect: () => void;
	/** 되돌리기 어려운 동작(탈퇴 등)은 붉게 */
	readonly tone?: 'default' | 'danger';
}

interface Props {
	/** 버튼의 접근성 이름 */
	label: string;
	icon: ReactNode;
	items: readonly MenuItem[];
}

/** 아이콘 버튼 + 아래로 열리는 메뉴. 바깥을 누르거나 Esc 로 닫는다 */
export const MenuButton = (props: Props) => {
	const { label, icon, items } = props;
	const [isOpen, setIsOpen] = useState(false);
	const containerRef = useRef<HTMLDivElement>(null);
	const menuId = useId();

	useEffect(() => {
		if (!isOpen) return;
		const closeOnOutside = (event: MouseEvent) => {
			if (event.target instanceof Node && !containerRef.current?.contains(event.target)) setIsOpen(false);
		};
		const closeOnEscape = (event: KeyboardEvent) => {
			if (event.key === 'Escape') setIsOpen(false);
		};
		document.addEventListener('mousedown', closeOnOutside);
		document.addEventListener('keydown', closeOnEscape);
		return () => {
			document.removeEventListener('mousedown', closeOnOutside);
			document.removeEventListener('keydown', closeOnEscape);
		};
	}, [isOpen]);

	return (
		<div ref={containerRef} className="relative">
			<button
				type="button"
				aria-label={label}
				aria-haspopup="menu"
				aria-expanded={isOpen}
				aria-controls={isOpen ? menuId : undefined}
				onClick={() => setIsOpen(open => !open)}
				className="flex size-10 items-center justify-center rounded-full text-gray-600 hover:bg-gray-100 focus-visible:outline-2 focus-visible:outline-brand-600"
			>
				{icon}
			</button>
			{isOpen && (
				<ul
					id={menuId}
					role="menu"
					className="absolute top-full right-0 z-40 mt-1 min-w-44 overflow-hidden rounded-xl bg-white py-1 shadow-lg ring-1 ring-gray-200"
				>
					{items.map(item => (
						<li key={item.label} role="none">
							<button
								type="button"
								role="menuitem"
								onClick={() => {
									setIsOpen(false);
									item.onSelect();
								}}
								className={
									item.tone === 'danger'
										? 'block w-full px-4 py-3 text-left text-sm font-medium text-red-700 hover:bg-red-50 focus-visible:bg-red-50 focus-visible:outline-none'
										: 'block w-full px-4 py-3 text-left text-sm font-medium text-gray-800 hover:bg-gray-50 focus-visible:bg-gray-50 focus-visible:outline-none'
								}
							>
								{item.label}
							</button>
						</li>
					))}
				</ul>
			)}
		</div>
	);
};

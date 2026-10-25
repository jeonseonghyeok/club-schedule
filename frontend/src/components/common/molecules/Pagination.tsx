import { cn } from '@/utils';

interface Props {
	currentPage: number;
	totalPages: number;
	/** 서버가 계산한 페이지 버튼 블록(5개 단위) */
	startPage: number;
	endPage: number;
	onChange: (page: number) => void;
	label: string;
}

const PAGE_BUTTON_CLASS =
	'min-w-9 rounded-md px-2 py-1 text-sm ring-1 ring-gray-300 focus-visible:outline-2 focus-visible:outline-gray-900 disabled:cursor-not-allowed disabled:opacity-40';

const range = (start: number, end: number): number[] =>
	Array.from({ length: Math.max(0, end - start + 1) }, (_, index) => start + index);

export const Pagination = (props: Props) => {
	const { currentPage, totalPages, startPage, endPage, onChange, label } = props;
	if (totalPages <= 1) return null;

	return (
		<nav aria-label={label} className="mt-3 flex flex-wrap items-center justify-center gap-1">
			<button
				type="button"
				className={PAGE_BUTTON_CLASS}
				disabled={currentPage <= 1}
				onClick={() => onChange(currentPage - 1)}
			>
				이전
			</button>
			{range(startPage, endPage).map(page => (
				<button
					key={page}
					type="button"
					aria-current={page === currentPage ? 'page' : undefined}
					onClick={() => onChange(page)}
					className={cn(PAGE_BUTTON_CLASS, page === currentPage && 'bg-gray-900 font-bold text-white ring-gray-900')}
				>
					{page}
				</button>
			))}
			<button
				type="button"
				className={PAGE_BUTTON_CLASS}
				disabled={currentPage >= totalPages}
				onClick={() => onChange(currentPage + 1)}
			>
				다음
			</button>
		</nav>
	);
};

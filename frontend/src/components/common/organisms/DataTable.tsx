import type { ReactNode } from 'react';

export interface DataTableColumn<T> {
	readonly header: string;
	readonly render: (row: T) => ReactNode;
}

interface Props<T> {
	caption: string;
	columns: readonly DataTableColumn<T>[];
	rows: readonly T[];
	getRowKey: (row: T) => string | number;
	emptyMessage?: string;
}

// 좁은 화면에서는 표를 가로로 스크롤한다.
export const DataTable = <T,>(props: Props<T>) => {
	const { caption, columns, rows, getRowKey, emptyMessage = '조회 결과가 없습니다.' } = props;

	return (
		<div className="overflow-x-auto">
			<table className="min-w-full border-collapse text-sm">
				<caption className="sr-only">{caption}</caption>
				<thead>
					<tr>
						{columns.map(column => (
							<th
								key={column.header}
								scope="col"
								className="border-b border-gray-200 bg-gray-50 px-3 py-2 text-left font-semibold whitespace-nowrap text-gray-700"
							>
								{column.header}
							</th>
						))}
					</tr>
				</thead>
				<tbody>
					{rows.length === 0 ? (
						<tr>
							<td colSpan={columns.length} className="px-3 py-6 text-center text-gray-500">
								{emptyMessage}
							</td>
						</tr>
					) : (
						rows.map(row => (
							<tr key={getRowKey(row)} className="border-b border-gray-100 last:border-0">
								{columns.map(column => (
									<td key={column.header} className="px-3 py-2 whitespace-nowrap text-gray-900">
										{column.render(row)}
									</td>
								))}
							</tr>
						))
					)}
				</tbody>
			</table>
		</div>
	);
};

import type { ReactNode } from 'react';
import { EmptyMessage } from '@/components/common/atoms/EmptyMessage';
import { getErrorMessage } from '@/utils';
import type { ServerError } from '@/modules/api/setupInterceptors';

interface Props {
	isPending: boolean;
	error: { response?: { data?: ServerError } } | null;
	totalCount: number | undefined;
	unit: string;
	children: ReactNode;
}

/** 관리자 목록 공통: 로딩·오류 안내와 "총 N건" 머리말 */
export const AdminListStatus = (props: Props) => {
	const { isPending, error, totalCount, unit, children } = props;
	if (isPending) return <EmptyMessage message="불러오는 중..." />;
	if (error) return <EmptyMessage message={`오류: ${getErrorMessage(error.response?.data)}`} />;

	return (
		<>
			<p role="status" className="mb-2 text-sm text-gray-600">
				총 {totalCount ?? 0}
				{unit}
			</p>
			{children}
		</>
	);
};

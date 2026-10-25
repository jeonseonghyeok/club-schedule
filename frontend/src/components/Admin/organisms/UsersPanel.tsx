import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { AdminListStatus } from '@/components/Admin/molecules/AdminListStatus';
import { AdminSearchBar } from '@/components/Admin/molecules/AdminSearchBar';
import { Pagination } from '@/components/common/molecules/Pagination';
import { DataTable } from '@/components/common/organisms/DataTable';
import type { DataTableColumn } from '@/components/common/organisms/DataTable';
import { adminQueries } from '@/modules/stores/server/admin/queries';
import type { AdminListParams, AdminUser } from '@/types/Admin';
import { formatOptional } from '@/utils/admin';
import { formatDateTime } from '@/utils/date';

const COLUMNS: readonly DataTableColumn<AdminUser>[] = [
	{ header: '사용자키', render: user => user.userKey },
	{ header: '카카오ID', render: user => formatOptional(user.kakaoApiId) },
	{ header: '닉네임', render: user => formatOptional(user.nickname) },
	{ header: '가입일', render: user => formatDateTime(user.createdAt) },
	{ header: '권한', render: user => formatOptional(user.systemRole) },
];

export const UsersPanel = () => {
	const [params, setParams] = useState<AdminListParams>({ page: 1, q: '' });
	const { data, isPending, error } = useQuery({ ...adminQueries.users(params) });

	return (
		<>
			<AdminSearchBar
				label="닉네임·가입 경로"
				placeholder="닉네임 또는 가입 경로"
				onSearch={q => setParams({ page: 1, q })}
			/>
			<AdminListStatus isPending={isPending} error={error} totalCount={data?.totalCount} unit="명">
				{data && (
					<>
						<DataTable caption="회원 목록" columns={COLUMNS} rows={data.items} getRowKey={user => user.userKey} />
						<Pagination
							label="회원 목록 페이지"
							currentPage={data.currentPage}
							totalPages={data.totalPages}
							startPage={data.startPage}
							endPage={data.endPage}
							onChange={page => setParams(prev => ({ ...prev, page }))}
						/>
					</>
				)}
			</AdminListStatus>
		</>
	);
};

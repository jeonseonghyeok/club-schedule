import { useQuery } from '@tanstack/react-query';
import { useId, useState } from 'react';
import { AdminListStatus } from '@/components/Admin/molecules/AdminListStatus';
import { AdminSearchBar } from '@/components/Admin/molecules/AdminSearchBar';
import { Pagination } from '@/components/common/molecules/Pagination';
import { DataTable } from '@/components/common/organisms/DataTable';
import type { DataTableColumn } from '@/components/common/organisms/DataTable';
import { adminQueries } from '@/modules/stores/server/admin/queries';
import { SYSTEM_ROLE } from '@/types/Admin';
import type { AdminUser, AdminUserListParams } from '@/types/Admin';
import { formatOptional } from '@/utils/admin';
import { formatDateTime } from '@/utils/date';

const COLUMNS: readonly DataTableColumn<AdminUser>[] = [
	{ header: '사용자키', render: user => user.userKey },
	{ header: '카카오ID', render: user => formatOptional(user.kakaoApiId) },
	{ header: '닉네임', render: user => formatOptional(user.nickname) },
	{ header: '가입일', render: user => formatDateTime(user.createdAt) },
	{ header: '권한', render: user => formatOptional(user.systemRole) },
];

const ROLE_OPTIONS = [
	{ value: '', label: '전체' },
	{ value: SYSTEM_ROLE.USER, label: 'USER' },
	{ value: SYSTEM_ROLE.ADMIN, label: 'ADMIN' },
] as const satisfies readonly { value: AdminUserListParams['role']; label: string }[];

const isRoleOption = (value: string): value is AdminUserListParams['role'] =>
	ROLE_OPTIONS.some(option => option.value === value);

export const UsersPanel = () => {
	const roleId = useId();
	const [role, setRole] = useState<AdminUserListParams['role']>('');
	const [params, setParams] = useState<AdminUserListParams>({ page: 1, q: '', from: '', to: '', role: '' });
	const { data, isPending, error } = useQuery({ ...adminQueries.users(params) });

	return (
		<>
			<AdminSearchBar
				label="닉네임·가입 경로"
				placeholder="닉네임 또는 가입 경로"
				dateLabel="가입일"
				onSearch={criteria => setParams({ page: 1, ...criteria, role })}
				extra={
					<div className="flex flex-col gap-1">
						<label htmlFor={roleId} className="text-xs font-medium text-gray-700">
							권한
						</label>
						<select
							id={roleId}
							value={role}
							onChange={event => {
								if (isRoleOption(event.target.value)) setRole(event.target.value);
							}}
							className="rounded-md border border-gray-300 px-3 py-1.5 text-sm focus-visible:outline-2 focus-visible:outline-gray-900"
						>
							{ROLE_OPTIONS.map(option => (
								<option key={option.label} value={option.value}>
									{option.label}
								</option>
							))}
						</select>
					</div>
				}
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

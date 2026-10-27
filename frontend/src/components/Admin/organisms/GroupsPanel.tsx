import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { AdminListStatus } from '@/components/Admin/molecules/AdminListStatus';
import { AdminSearchBar } from '@/components/Admin/molecules/AdminSearchBar';
import { Pagination } from '@/components/common/molecules/Pagination';
import { DataTable } from '@/components/common/organisms/DataTable';
import type { DataTableColumn } from '@/components/common/organisms/DataTable';
import { adminQueries } from '@/modules/stores/server/admin/queries';
import type { AdminGroup, AdminListParams } from '@/types/Admin';
import { formatOptional } from '@/utils/admin';
import { formatDateTime } from '@/utils/date';
import { getGroupName, getGroupPath } from '@/utils/group';

const COLUMNS: readonly DataTableColumn<AdminGroup>[] = [
	{ header: '그룹번호', render: group => group.groupId },
	{
		header: '이름',
		render: group => (
			// 모임 화면은 아직 서버 렌더링 — 새 탭으로 연다
			<a
				href={getGroupPath(group.groupId)}
				target="_blank"
				rel="noreferrer"
				className="font-medium text-blue-700 hover:underline focus-visible:outline-2 focus-visible:outline-gray-900"
			>
				{getGroupName(group)}
			</a>
		),
	},
	{ header: '리더번호', render: group => formatOptional(group.leaderUserKey) },
	{ header: '수용인원', render: group => formatOptional(group.capacity) },
	{ header: '현재인원', render: group => formatOptional(group.currentMemberCount) },
	{ header: '자동승인', render: group => formatOptional(group.autoApprove) },
	{ header: '일정 등록 권한 정책', render: group => formatOptional(group.schedulePolicy) },
	{ header: '그룹요청번호', render: group => formatOptional(group.groupRequestId) },
	{ header: '생성일', render: group => formatDateTime(group.createdAt) },
];

export const GroupsPanel = () => {
	const [params, setParams] = useState<AdminListParams>({ page: 1, q: '', from: '', to: '' });
	const { data, isPending, error } = useQuery({ ...adminQueries.groups(params) });

	return (
		<>
			<AdminSearchBar
				label="그룹명"
				placeholder="그룹명"
				dateLabel="생성일"
				onSearch={criteria => setParams({ page: 1, ...criteria })}
			/>
			<AdminListStatus isPending={isPending} error={error} totalCount={data?.totalCount} unit="건">
				{data && (
					<>
						<DataTable caption="그룹 목록" columns={COLUMNS} rows={data.items} getRowKey={group => group.groupId} />
						<Pagination
							label="그룹 목록 페이지"
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

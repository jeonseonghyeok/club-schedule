import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { AdminListStatus } from '@/components/Admin/molecules/AdminListStatus';
import { AdminSearchBar } from '@/components/Admin/molecules/AdminSearchBar';
import { ReasonDialog } from '@/components/common/organisms/ReasonDialog';
import { Button } from '@/components/common/atoms/Button';
import { Pagination } from '@/components/common/molecules/Pagination';
import { DataTable } from '@/components/common/organisms/DataTable';
import type { DataTableColumn } from '@/components/common/organisms/DataTable';
import { ModalType } from '@/constants';
import { useModalStore } from '@/modules/stores/client/modal';
import { useApproveGroupJoin, useRejectGroupJoin } from '@/modules/stores/server/admin/mutations';
import { adminQueries } from '@/modules/stores/server/admin/queries';
import type { AdminGroupJoin, AdminListParams } from '@/types/Admin';
import { ADMIN_STATUS_LABEL, formatOptional } from '@/utils/admin';
import { formatDateTime } from '@/utils/date';

const joinLabel = (join: AdminGroupJoin): string => `[${formatOptional(join.groupName)}]`;

export const GroupJoinsPanel = () => {
	const [params, setParams] = useState<AdminListParams>({ page: 1, q: '' });
	const [rejecting, setRejecting] = useState<AdminGroupJoin | null>(null);
	const { data, isPending, error } = useQuery({ ...adminQueries.groupJoins(params) });
	const openModal = useModalStore(state => state.actions.openModal);
	const { mutate: approve } = useApproveGroupJoin();
	const { mutate: reject, isPending: isRejecting } = useRejectGroupJoin();

	const confirmApprove = (join: AdminGroupJoin) =>
		openModal({
			type: ModalType.CONFIRM,
			message: `${joinLabel(join)} 가입 요청을 승인하시겠습니까?`,
			confirmLabel: '승인',
			onConfirm: () => approve(join.requestId),
		});

	const columns: readonly DataTableColumn<AdminGroupJoin>[] = [
		{ header: '신청번호', render: join => join.requestId },
		{ header: '모임명', render: join => formatOptional(join.groupName) },
		{ header: '요청자', render: join => join.nickname || join.userKey },
		{ header: '신청일시', render: join => formatDateTime(join.requestedAt) },
		{ header: '상태', render: join => ADMIN_STATUS_LABEL[join.status] },
		{
			header: '처리',
			render: join => (
				<span className="flex gap-1">
					<Button
						className="px-3 py-1"
						aria-label={`${joinLabel(join)} ${join.nickname ?? ''} 승인`}
						onClick={() => confirmApprove(join)}
					>
						승인
					</Button>
					<Button
						variant="danger"
						className="px-3 py-1"
						aria-label={`${joinLabel(join)} ${join.nickname ?? ''} 거부`}
						onClick={() => setRejecting(join)}
					>
						거부
					</Button>
				</span>
			),
		},
	];

	return (
		<>
			<p className="mb-2 text-sm text-gray-600">승인대기 중인 가입 요청만 표시됩니다.</p>
			<AdminSearchBar
				label="닉네임·그룹명"
				placeholder="요청자 닉네임 또는 그룹명"
				onSearch={q => setParams({ page: 1, q })}
			/>
			<AdminListStatus isPending={isPending} error={error} totalCount={data?.totalCount} unit="건">
				{data && (
					<>
						<DataTable
							caption="가입 요청 목록"
							columns={columns}
							rows={data.items}
							getRowKey={join => join.requestId}
						/>
						<Pagination
							label="가입 요청 목록 페이지"
							currentPage={data.currentPage}
							totalPages={data.totalPages}
							startPage={data.startPage}
							endPage={data.endPage}
							onChange={page => setParams(prev => ({ ...prev, page }))}
						/>
					</>
				)}
			</AdminListStatus>
			{rejecting && (
				<ReasonDialog
					title={`${joinLabel(rejecting)} 가입 요청 거부`}
					isReasonRequired={false}
					isSubmitting={isRejecting}
					onSubmit={reason =>
						reject({ requestId: rejecting.requestId, rejectReason: reason }, { onSuccess: () => setRejecting(null) })
					}
					onClose={() => setRejecting(null)}
				/>
			)}
		</>
	);
};

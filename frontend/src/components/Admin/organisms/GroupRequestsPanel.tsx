import { useQuery } from '@tanstack/react-query';
import { useId, useState } from 'react';
import { AdminListStatus } from '@/components/Admin/molecules/AdminListStatus';
import { AdminSearchBar } from '@/components/Admin/molecules/AdminSearchBar';
import { GroupRequestReviewDialog } from '@/components/Admin/organisms/GroupRequestReviewDialog';
import { RejectReasonDialog } from '@/components/Admin/organisms/RejectReasonDialog';
import { Button } from '@/components/common/atoms/Button';
import { Pagination } from '@/components/common/molecules/Pagination';
import { DataTable } from '@/components/common/organisms/DataTable';
import type { DataTableColumn } from '@/components/common/organisms/DataTable';
import { ModalType } from '@/constants';
import { useModalStore } from '@/modules/stores/client/modal';
import { useApproveGroupRequest, useRejectGroupRequest } from '@/modules/stores/server/admin/mutations';
import { adminQueries } from '@/modules/stores/server/admin/queries';
import type { AdminGroupRequest, AdminGroupRequestListParams } from '@/types/Admin';
import { GROUP_REQUEST_STATUS } from '@/types/GroupRequest';
import { ADMIN_STATUS_LABEL, formatOptional, GROUP_REQUEST_REJECT_PRESETS } from '@/utils/admin';
import { formatDateTime } from '@/utils/date';
import { getGroupPath } from '@/utils/group';

const STATUS_OPTIONS = [
	{ value: GROUP_REQUEST_STATUS.PENDING, label: '대기 (기본)' },
	{ value: '', label: '전체 이력' },
	{ value: GROUP_REQUEST_STATUS.APPROVED, label: '승인' },
	{ value: GROUP_REQUEST_STATUS.REJECTED, label: '거부' },
	{ value: GROUP_REQUEST_STATUS.CANCELLED, label: '취소' },
] as const satisfies readonly { value: AdminGroupRequestListParams['status']; label: string }[];

const isStatusOption = (value: string): value is AdminGroupRequestListParams['status'] =>
	STATUS_OPTIONS.some(option => option.value === value);

type Review = { step: 'detail' | 'reject'; request: AdminGroupRequest } | null;

const requestLabel = (request: AdminGroupRequest): string => `[${formatOptional(request.groupName)}]`;

export const GroupRequestsPanel = () => {
	const statusId = useId();
	const [status, setStatus] = useState<AdminGroupRequestListParams['status']>(GROUP_REQUEST_STATUS.PENDING);
	const [params, setParams] = useState<AdminGroupRequestListParams>({ page: 1, q: '', status });
	const [review, setReview] = useState<Review>(null);
	const { data, isPending, error } = useQuery({ ...adminQueries.groupRequests(params) });
	const openModal = useModalStore(state => state.actions.openModal);
	const { mutate: approve } = useApproveGroupRequest();
	const { mutate: reject, isPending: isRejecting } = useRejectGroupRequest();

	const confirmApprove = (request: AdminGroupRequest) => {
		setReview(null);
		openModal({
			type: ModalType.CONFIRM,
			message: `${requestLabel(request)} 신청을 승인하시겠습니까?`,
			confirmLabel: '승인',
			onConfirm: () =>
				approve(request.requestId, {
					onSuccess: ({ groupId }) =>
						openModal({
							type: ModalType.CONFIRM,
							message: '승인되었습니다. 생성된 모임 화면을 새 탭으로 열까요?',
							confirmLabel: '열기',
							onConfirm: () => window.open(getGroupPath(groupId), '_blank', 'noopener'),
						}),
				}),
		});
	};

	const submitReject = (request: AdminGroupRequest, rejectReason: string) =>
		reject(
			{ requestId: request.requestId, rejectReason },
			{
				onSuccess: () => {
					setReview(null);
					openModal({ type: ModalType.ALERT, message: '거부 처리되었습니다.' });
				},
			},
		);

	const columns: readonly DataTableColumn<AdminGroupRequest>[] = [
		{ header: '신청번호', render: request => request.requestId },
		{ header: '모임명', render: request => formatOptional(request.groupName) },
		{ header: '요청자(userKey)', render: request => request.userKey },
		{ header: '신청일시', render: request => formatDateTime(request.requestedAt) },
		{ header: '상태', render: request => ADMIN_STATUS_LABEL[request.status] },
		{
			header: '상세',
			render: request => (
				<Button
					variant="secondary"
					className="px-3 py-1"
					aria-label={`${requestLabel(request)} 신청 상세`}
					onClick={() => setReview({ step: 'detail', request })}
				>
					보기
				</Button>
			),
		},
	];

	return (
		<>
			<AdminSearchBar
				label="모임명"
				placeholder="모임명 검색"
				onSearch={q => setParams({ page: 1, q, status })}
				extra={
					<div className="flex flex-col gap-1">
						<label htmlFor={statusId} className="text-xs font-medium text-gray-700">
							상태
						</label>
						<select
							id={statusId}
							value={status}
							onChange={event => {
								if (isStatusOption(event.target.value)) setStatus(event.target.value);
							}}
							className="rounded-md border border-gray-300 px-3 py-1.5 text-sm focus-visible:outline-2 focus-visible:outline-gray-900"
						>
							{STATUS_OPTIONS.map(option => (
								<option key={option.label} value={option.value}>
									{option.label}
								</option>
							))}
						</select>
					</div>
				}
			/>
			<AdminListStatus isPending={isPending} error={error} totalCount={data?.totalCount} unit="건">
				{data && (
					<>
						<DataTable
							caption="그룹 신청 목록"
							columns={columns}
							rows={data.items}
							getRowKey={request => request.requestId}
						/>
						<Pagination
							label="그룹 신청 목록 페이지"
							currentPage={data.currentPage}
							totalPages={data.totalPages}
							startPage={data.startPage}
							endPage={data.endPage}
							onChange={page => setParams(prev => ({ ...prev, page }))}
						/>
					</>
				)}
			</AdminListStatus>
			{review?.step === 'detail' && (
				<GroupRequestReviewDialog
					request={review.request}
					onApprove={confirmApprove}
					onReject={request => setReview({ step: 'reject', request })}
					onClose={() => setReview(null)}
				/>
			)}
			{review?.step === 'reject' && (
				<RejectReasonDialog
					title={`${requestLabel(review.request)} 거부 사유 선택`}
					presets={GROUP_REQUEST_REJECT_PRESETS}
					isReasonRequired
					isSubmitting={isRejecting}
					onSubmit={reason => submitReject(review.request, reason)}
					onClose={() => setReview(null)}
				/>
			)}
		</>
	);
};

import { useQuery } from '@tanstack/react-query';
import { EmptyMessage } from '@/components/common/atoms/EmptyMessage';
import { Dialog } from '@/components/common/organisms/Dialog';
import { attendanceQueries } from '@/modules/stores/server/attendance/queries';
import type { ActualStatus, AttendanceStatus } from '@/types/Schedule';
import { formatDateTime } from '@/utils/date';

const STATUS_LABEL = {
	PENDING: '대기',
	CONFIRMED: '참가확정',
	REJECTED: '거부',
	CANCELLED: '취소',
} as const satisfies Record<AttendanceStatus, string>;

const ACTUAL_SUFFIX = { ATTENDED: ' · 출석', NOSHOW: ' · 결석', NONE: '' } as const satisfies Record<
	ActualStatus,
	string
>;

interface Props {
	groupId: number;
	onClose: () => void;
}

/** 내가 이 모임에서 신청·참가한 일정들의 최신 상태 */
export const MyAttendanceDialog = (props: Props) => {
	const { groupId, onClose } = props;
	const { data: history, isError } = useQuery({ ...attendanceQueries.mine(groupId) });

	const renderBody = () => {
		if (isError) return <EmptyMessage message="참가 이력을 불러오지 못했습니다." />;
		if (!history) return <EmptyMessage message="로딩 중..." />;
		if (history.length === 0) return <EmptyMessage message="참가 이력이 없습니다." />;
		return (
			<table className="w-full text-sm">
				<caption className="sr-only">내 참가 이력</caption>
				<thead>
					<tr className="border-b border-gray-200 text-left">
						<th scope="col" className="px-1 py-1.5">
							일정
						</th>
						<th scope="col" className="px-1 py-1.5">
							시작일시
						</th>
						<th scope="col" className="px-1 py-1.5">
							상태
						</th>
					</tr>
				</thead>
				<tbody>
					{history.map(item => (
						<tr key={item.scheduleId} className="border-b border-gray-100">
							<td className="px-1 py-1.5">{item.scheduleTitle || '(제목 없음)'}</td>
							<td className="px-1 py-1.5 text-gray-600">{formatDateTime(item.scheduleStartAt)}</td>
							<td className="px-1 py-1.5">
								{STATUS_LABEL[item.status]}
								{ACTUAL_SUFFIX[item.actualStatus ?? 'NONE']}
							</td>
						</tr>
					))}
				</tbody>
			</table>
		);
	};

	return (
		<Dialog title="내 참가 이력" size="md" onClose={onClose}>
			{renderBody()}
		</Dialog>
	);
};

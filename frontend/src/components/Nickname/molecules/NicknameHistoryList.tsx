import { EmptyMessage } from '@/components/common/atoms/EmptyMessage';
import type { NicknameHistory } from '@/types/Nickname';
import { formatDateTime } from '@/utils/date';

const EMPTY_NAME = '(없음)';

/** 계정 이력은 "계정", 모임 이력은 모임 이름 — 한 모임만 보여줄 때는 생략 */
const getScopeLabel = (item: NicknameHistory): string =>
	item.groupId === null ? '계정' : (item.groupName ?? `모임 #${item.groupId}`);

const getChangedByLabel = (item: NicknameHistory): string =>
	item.changedBy === item.userKey ? '본인이 변경' : `${item.changedByName ?? `사용자 #${item.changedBy}`}님이 변경`;

interface Props {
	items: readonly NicknameHistory[];
	/** 계정·여러 모임 이력을 섞어 보여줄 때 어디의 이름인지 표시한다 */
	showScope?: boolean;
}

export const NicknameHistoryList = (props: Props) => {
	const { items, showScope = false } = props;
	if (items.length === 0) return <EmptyMessage message="변경 이력이 없습니다." />;

	return (
		<ol className="divide-y divide-gray-100">
			{items.map(item => (
				<li key={item.historyId} className="flex flex-col gap-0.5 py-2.5 text-sm">
					<p className="text-gray-900">
						{showScope && (
							<span className="mr-1.5 rounded bg-gray-100 px-1.5 py-0.5 text-xs font-semibold text-gray-600">
								{getScopeLabel(item)}
							</span>
						)}
						<span className="text-gray-500">{item.oldNickname ?? EMPTY_NAME}</span>
						<span aria-label="에서" className="mx-1 text-gray-400">
							→
						</span>
						<span className="font-semibold">{item.newNickname ?? EMPTY_NAME}</span>
					</p>
					<p className="text-xs text-gray-500">
						{formatDateTime(item.createdAt)} · {getChangedByLabel(item)}
					</p>
				</li>
			))}
		</ol>
	);
};

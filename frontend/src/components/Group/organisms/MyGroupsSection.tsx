import { Link } from '@tanstack/react-router';
import type { ReactNode } from 'react';
import { EmptyMessage } from '@/components/common/atoms/EmptyMessage';
import { SectionCard } from '@/components/common/molecules/SectionCard';
import type { Group } from '@/types/Group';
import { formatMemberCount, getGroupName, sortFavoriteFirst } from '@/utils/group';

export type MyGroupsState =
	{ status: 'guest' } | { status: 'loading' } | { status: 'error' } | { status: 'success'; groups: readonly Group[] };

interface Props {
	state: MyGroupsState;
	favoriteGroupId: number | null;
	/** 신규 모임 생성 신청 버튼 자리 */
	actions?: ReactNode;
}

interface GroupItemProps {
	group: Group;
	isFavorite: boolean;
}

const GroupItem = (props: GroupItemProps) => {
	const { group, isFavorite } = props;
	return (
		<li className="py-3">
			<Link
				to="/groups/$groupId"
				params={{ groupId: String(group.groupId) }}
				search={{ tab: 'home' }}
				className="font-semibold text-gray-900 hover:underline focus-visible:outline-2 focus-visible:outline-gray-900"
			>
				{isFavorite && (
					<>
						<span aria-hidden="true">★ </span>
						<span className="sr-only">즐겨찾기 모임: </span>
					</>
				)}
				{getGroupName(group)}
			</Link>
			<p className="mt-0.5 text-sm text-gray-500">{formatMemberCount(group)}</p>
		</li>
	);
};

export const MyGroupsSection = (props: Props) => {
	const { state, favoriteGroupId, actions } = props;

	const renderBody = () => {
		switch (state.status) {
			case 'guest':
				return <EmptyMessage message="로그인이 필요합니다." />;
			case 'loading':
				return <EmptyMessage message="로딩 중..." />;
			case 'error':
				return <EmptyMessage message="모임 정보를 불러오는데 실패했습니다." />;
			case 'success':
				if (state.groups.length === 0) return <EmptyMessage message="모임이 없습니다." />;
				return (
					<ul className="divide-y divide-gray-100">
						{sortFavoriteFirst(state.groups, favoriteGroupId).map(group => (
							<GroupItem key={group.groupId} group={group} isFavorite={group.groupId === favoriteGroupId} />
						))}
					</ul>
				);
			default: {
				const exhaustive: never = state;
				return exhaustive;
			}
		}
	};

	return (
		<SectionCard title="내 모임" actions={actions}>
			{renderBody()}
		</SectionCard>
	);
};

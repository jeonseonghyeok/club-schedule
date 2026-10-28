import { Link } from '@tanstack/react-router';
import type { ReactNode } from 'react';
import { LoginCard } from '@/components/Auth/organisms/LoginCard';
import { EmptyMessage } from '@/components/common/atoms/EmptyMessage';
import { Icon } from '@/components/common/atoms/Icon';
import { SectionCard } from '@/components/common/molecules/SectionCard';
import type { MyGroup } from '@/types/Group';
import { formatMemberCount, getGroupName, sortFavoriteFirst } from '@/utils/group';

export type MyGroupsState =
	{ status: 'guest' } | { status: 'loading' } | { status: 'error' } | { status: 'success'; groups: readonly MyGroup[] };

interface Props {
	state: MyGroupsState;
	favoriteGroupId: number | null;
	/** 신규 모임 생성 신청 버튼 자리 */
	actions?: ReactNode;
}

interface GroupItemProps {
	group: MyGroup;
	isFavorite: boolean;
}

const GroupItem = (props: GroupItemProps) => {
	const { group, isFavorite } = props;
	return (
		<li>
			<Link
				to="/groups/$groupId"
				params={{ groupId: String(group.groupId) }}
				search={{ tab: 'home' }}
				className="-mx-2 flex items-center gap-3 rounded-xl px-2 py-3 hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-brand-600"
			>
				<span
					aria-hidden="true"
					className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-base font-bold text-brand-700"
				>
					{getGroupName(group).slice(0, 1)}
				</span>
				<span className="min-w-0 flex-1">
					<span className="flex items-center gap-1.5 font-semibold text-gray-900">
						<span className="truncate">{getGroupName(group)}</span>
						{isFavorite && (
							<span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-800">
								우선모임
							</span>
						)}
					</span>
					<span className="mt-0.5 block truncate text-sm text-gray-500">
						{formatMemberCount(group)}
						{group.regionName && ` · ${group.regionName}`}
					</span>
				</span>
				<Icon name="chevronRight" className="shrink-0 text-gray-400" />
			</Link>
		</li>
	);
};

export const MyGroupsSection = (props: Props) => {
	const { state, favoriteGroupId, actions } = props;
	if (state.status === 'guest') {
		return (
			<LoginCard
				title="내 모임"
				message="로그인하면 가입한 모임과 일정을 한곳에서 볼 수 있어요. 둘러보기는 로그인 없이도 됩니다."
			/>
		);
	}

	const renderBody = () => {
		switch (state.status) {
			case 'loading':
				return <EmptyMessage message="로딩 중..." />;
			case 'error':
				return <EmptyMessage message="모임 정보를 불러오는데 실패했습니다." />;
			case 'success':
				if (state.groups.length === 0) return <EmptyMessage message="모임이 없습니다." />;
				return (
					<ul className="flex flex-col">
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

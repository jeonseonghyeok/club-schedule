import { useQuery } from '@tanstack/react-query';
import { useId, useState } from 'react';
import { EmptyMessage } from '@/components/common/atoms/EmptyMessage';
import { Icon } from '@/components/common/atoms/Icon';
import { NicknameHistoryList } from '@/components/Nickname/molecules/NicknameHistoryList';
import { memberQueries } from '@/modules/stores/server/member/queries';
import { cn } from '@/utils';

interface Props {
	groupId: number;
	userKey: number;
}

/** 한 회원의 이 모임 닉네임 변경 이력 — 그려질 때 불러온다(같은 모임 회원 누구나 볼 수 있다) */
export const MemberNicknameHistoryPanel = (props: Props & { id?: string }) => {
	const { groupId, userKey, id } = props;
	const { data: items, isError } = useQuery({ ...memberQueries.nicknameHistory(groupId, userKey) });

	const renderBody = () => {
		if (isError) return <EmptyMessage message="이력을 불러오지 못했습니다." />;
		if (!items) return <EmptyMessage message="로딩 중..." />;
		return <NicknameHistoryList items={items} />;
	};

	return (
		<div id={id} className="max-h-60 overflow-y-auto">
			{renderBody()}
		</div>
	);
};

/** 펼쳐 보는 "닉네임 변경 이력"(전용 앱 내 정보) */
export const MemberNicknameHistory = (props: Props) => {
	const { groupId, userKey } = props;
	const panelId = useId();
	const [isOpen, setIsOpen] = useState(false);

	return (
		<section className="mt-4 border-t border-gray-100 pt-3">
			<button
				type="button"
				aria-expanded={isOpen}
				aria-controls={panelId}
				onClick={() => setIsOpen(prev => !prev)}
				className="flex w-full items-center justify-between text-sm font-medium text-gray-800 focus-visible:outline-2 focus-visible:outline-brand-600"
			>
				닉네임 변경 이력
				<Icon name="chevronRight" className={cn('text-gray-400 transition-transform', isOpen && 'rotate-90')} />
			</button>
			{isOpen && (
				<div className="mt-1">
					<MemberNicknameHistoryPanel id={panelId} groupId={groupId} userKey={userKey} />
				</div>
			)}
		</section>
	);
};

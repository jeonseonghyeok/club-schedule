import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { useId, useState } from 'react';
import { EmptyMessage } from '@/components/common/atoms/EmptyMessage';
import { Icon } from '@/components/common/atoms/Icon';
import { SectionCard } from '@/components/common/molecules/SectionCard';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { groupQueries } from '@/modules/stores/server/group/queries';
import { getDescriptionPreview, getGroupName } from '@/utils/group';

const SEARCH_DEBOUNCE_MS = 300;

interface Props {
	isGuest: boolean;
}

export const GroupSearchSection = (props: Props) => {
	const { isGuest } = props;
	const inputId = useId();
	const [keyword, setKeyword] = useState('');
	const debouncedKeyword = useDebouncedValue(keyword.trim(), SEARCH_DEBOUNCE_MS);
	const {
		data: groups,
		isPending,
		isError,
	} = useQuery({
		...groupQueries.recommended(debouncedKeyword),
		enabled: !isGuest,
	});

	const renderBody = () => {
		if (isGuest) return <EmptyMessage message="로그인이 필요합니다." />;
		if (isPending) return <EmptyMessage message="로딩 중..." />;
		if (isError) return <EmptyMessage message="불러오기 실패" />;
		if (groups.length === 0) return <EmptyMessage message="일치하는 모임을 찾지 못하였습니다." />;
		return (
			<ul className="flex flex-col">
				{groups.map(group => (
					<li key={group.groupId}>
						<Link
							to="/groups/$groupId"
							params={{ groupId: String(group.groupId) }}
							search={{ tab: 'home' }}
							className="-mx-2 flex items-center gap-3 rounded-xl px-2 py-3 hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-brand-600"
						>
							<span className="min-w-0 flex-1">
								<span className="block truncate font-semibold text-gray-900">{getGroupName(group)}</span>
								<span className="mt-0.5 block truncate text-sm text-gray-500">
									{getDescriptionPreview(group.description)}
								</span>
							</span>
							<Icon name="chevronRight" className="shrink-0 text-gray-400" />
						</Link>
					</li>
				))}
			</ul>
		);
	};

	return (
		<SectionCard title="모임 찾기">
			<div className="relative mb-2">
				<label htmlFor={inputId} className="sr-only">
					모임명 검색
				</label>
				<Icon
					name="search"
					size={18}
					className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-gray-400"
				/>
				<input
					id={inputId}
					type="search"
					value={keyword}
					onChange={event => setKeyword(event.target.value)}
					disabled={isGuest}
					placeholder="모임 이름으로 찾기"
					enterKeyHint="search"
					className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pr-3 pl-10 text-base focus-visible:bg-white focus-visible:outline-2 focus-visible:outline-brand-600 disabled:opacity-60 sm:text-sm"
				/>
			</div>
			{!debouncedKeyword && !isGuest && <p className="mb-1 text-xs text-gray-500">최근 일정이 올라온 모임</p>}
			{renderBody()}
		</SectionCard>
	);
};

import { useQuery } from '@tanstack/react-query';
import { useId, useState } from 'react';
import { EmptyMessage } from '@/components/common/atoms/EmptyMessage';
import { SectionCard } from '@/components/common/molecules/SectionCard';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { groupQueries } from '@/modules/stores/server/group/queries';
import { getDescriptionPreview, getGroupName, getGroupPath } from '@/utils/group';

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
			<ul className="divide-y divide-gray-100">
				{groups.map(group => (
					<li key={group.groupId} className="py-3">
						<a
							href={getGroupPath(group.groupId)}
							className="font-semibold text-gray-900 hover:underline focus-visible:outline-2 focus-visible:outline-gray-900"
						>
							{getGroupName(group)}
						</a>
						<p className="mt-0.5 text-sm text-gray-500">{getDescriptionPreview(group.description)}</p>
					</li>
				))}
			</ul>
		);
	};

	return (
		<SectionCard
			title="모임 검색"
			actions={
				<>
					<label htmlFor={inputId} className="sr-only">
						모임명 검색
					</label>
					<input
						id={inputId}
						type="search"
						value={keyword}
						onChange={event => setKeyword(event.target.value)}
						disabled={isGuest}
						placeholder="모임명 검색..."
						className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm sm:w-56 focus-visible:outline-2 focus-visible:outline-gray-900 disabled:bg-gray-100"
					/>
				</>
			}
		>
			{renderBody()}
		</SectionCard>
	);
};

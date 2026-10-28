import { useQuery } from '@tanstack/react-query';
import { useId, useState } from 'react';
import type { FormEvent } from 'react';
import { Button } from '@/components/common/atoms/Button';
import { Icon } from '@/components/common/atoms/Icon';
import { PLACE_KEYWORD_MIN, placeQueries } from '@/modules/stores/server/place/queries';
import type { PickedPlace } from '@/types/Place';
import { getErrorMessage } from '@/utils';

interface Props {
	/** 처음 검색창에 넣어 둘 말(지금 입력된 장소 이름 등) */
	initialKeyword: string;
	onSelect: (place: PickedPlace) => void;
	onCancel: () => void;
}

/**
 * 장소 검색 → 골라서 이름·좌표를 넘긴다. 폼 안에 들어가므로 <form> 대신 검색 영역을 직접 다룬다
 * (중첩 form 금지 — Enter 는 검색으로 처리).
 */
export const PlaceSearchPanel = (props: Props) => {
	const { initialKeyword, onSelect, onCancel } = props;
	const inputId = useId();
	const [draft, setDraft] = useState(initialKeyword);
	const [keyword, setKeyword] = useState('');
	const { data: places, isFetching, isError, error } = useQuery({ ...placeQueries.search(keyword) });

	const search = (event?: FormEvent) => {
		event?.preventDefault();
		setKeyword(draft.trim());
	};

	const renderResults = () => {
		if (!keyword) return null;
		if (keyword.length < PLACE_KEYWORD_MIN) {
			return <p className="text-sm text-gray-500">두 글자 이상 입력하세요.</p>;
		}
		if (isFetching) return <p className="text-sm text-gray-500">검색 중…</p>;
		if (isError) {
			return (
				<p role="alert" className="text-sm text-amber-800">
					{getErrorMessage(error.response?.data, '장소 검색에 실패했습니다.')}
				</p>
			);
		}
		if (!places || places.length === 0) return <p className="text-sm text-gray-500">검색 결과가 없습니다.</p>;
		return (
			<ul className="max-h-60 overflow-y-auto rounded-lg ring-1 ring-gray-200">
				{places.map(place => (
					<li
						key={`${place.name}-${place.latitude}-${place.longitude}`}
						className="border-b border-gray-100 last:border-0"
					>
						<button
							type="button"
							onClick={() => onSelect({ name: place.name, latitude: place.latitude, longitude: place.longitude })}
							className="flex w-full items-start gap-2 px-3 py-2.5 text-left hover:bg-gray-50 focus-visible:bg-brand-50 focus-visible:outline-none"
						>
							<Icon name="pin" size={18} className="mt-0.5 shrink-0 text-brand-700" />
							<span className="min-w-0">
								<span className="block truncate text-sm font-semibold text-gray-900">{place.name}</span>
								<span className="block truncate text-xs text-gray-500">{place.roadAddress || place.address}</span>
							</span>
						</button>
					</li>
				))}
			</ul>
		);
	};

	return (
		<div className="flex flex-col gap-2 rounded-xl bg-gray-50 p-3 ring-1 ring-gray-200">
			<label htmlFor={inputId} className="text-sm font-medium text-gray-800">
				장소 검색
			</label>
			<div className="flex gap-2">
				<input
					id={inputId}
					type="search"
					value={draft}
					enterKeyHint="search"
					placeholder="예: 강남역 스터디카페"
					onChange={event => setDraft(event.target.value)}
					onKeyDown={event => {
						if (event.key === 'Enter') search(event);
					}}
					className="min-w-0 flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-base focus-visible:outline-2 focus-visible:outline-brand-600 sm:text-sm"
				/>
				<Button onClick={() => search()}>검색</Button>
			</div>
			{renderResults()}
			<div className="flex justify-end">
				<Button variant="secondary" onClick={onCancel}>
					닫기
				</Button>
			</div>
		</div>
	);
};

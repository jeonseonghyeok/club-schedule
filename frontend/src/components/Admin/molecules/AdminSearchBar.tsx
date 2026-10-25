import { useId, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { Button } from '@/components/common/atoms/Button';

interface Props {
	label: string;
	placeholder: string;
	onSearch: (keyword: string) => void;
	/** 키워드 외 추가 조건(예: 그룹 신청 상태) */
	extra?: ReactNode;
}

export const AdminSearchBar = (props: Props) => {
	const { label, placeholder, onSearch, extra } = props;
	const inputId = useId();
	const [keyword, setKeyword] = useState('');

	const submit = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		onSearch(keyword.trim());
	};

	return (
		<form role="search" onSubmit={submit} className="mb-3 flex flex-wrap items-end gap-2">
			<div className="flex flex-col gap-1">
				<label htmlFor={inputId} className="text-xs font-medium text-gray-700">
					{label}
				</label>
				<input
					id={inputId}
					type="search"
					value={keyword}
					onChange={event => setKeyword(event.target.value)}
					placeholder={placeholder}
					className="w-56 rounded-md border border-gray-300 px-3 py-1.5 text-sm focus-visible:outline-2 focus-visible:outline-gray-900"
				/>
			</div>
			{extra}
			<Button type="submit">조회</Button>
		</form>
	);
};

import { useId, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { Button } from '@/components/common/atoms/Button';
import type { AdminSearchCriteria } from '@/types/Admin';

const FIELD_CLASS =
	'rounded-md border border-gray-300 px-3 py-1.5 text-sm focus-visible:outline-2 focus-visible:outline-gray-900';

interface Props {
	label: string;
	placeholder: string;
	/** 기간 입력란 이름(예: "가입일") — 양 끝 날짜를 포함한다 */
	dateLabel: string;
	onSearch: (criteria: AdminSearchCriteria) => void;
	/** 키워드·기간 외 추가 조건(예: 그룹 신청 상태) */
	extra?: ReactNode;
}

export const AdminSearchBar = (props: Props) => {
	const { label, placeholder, dateLabel, onSearch, extra } = props;
	const inputId = useId();
	const fromId = useId();
	const toId = useId();
	const [keyword, setKeyword] = useState('');
	const [from, setFrom] = useState('');
	const [to, setTo] = useState('');

	const submit = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		onSearch({ q: keyword.trim(), from, to });
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
					className={`w-56 ${FIELD_CLASS}`}
				/>
			</div>
			<div className="flex flex-col gap-1">
				<label htmlFor={fromId} className="text-xs font-medium text-gray-700">
					{dateLabel} 시작
				</label>
				<input
					id={fromId}
					type="date"
					value={from}
					max={to || undefined}
					onChange={event => setFrom(event.target.value)}
					className={FIELD_CLASS}
				/>
			</div>
			<div className="flex flex-col gap-1">
				<label htmlFor={toId} className="text-xs font-medium text-gray-700">
					{dateLabel} 끝
				</label>
				<input
					id={toId}
					type="date"
					value={to}
					min={from || undefined}
					onChange={event => setTo(event.target.value)}
					className={FIELD_CLASS}
				/>
			</div>
			{extra}
			<Button type="submit">조회</Button>
		</form>
	);
};

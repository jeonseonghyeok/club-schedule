import { useId } from 'react';
import type { UseFormRegisterReturn } from 'react-hook-form';
import { HOUR_OPTIONS } from '@/utils/dateTime';

interface Props {
	legend: string;
	dateField: UseFormRegisterReturn;
	hourField: UseFormRegisterReturn;
	minuteField: UseFormRegisterReturn;
	minuteOptions: readonly string[];
}

const SELECT_CLASS =
	'rounded-md border border-gray-300 px-2 py-2 focus-visible:outline-2 focus-visible:outline-gray-900';

/** 날짜 + 시 + 분 선택. 분은 30분 단위 또는 1분 단위 */
export const DateTimeField = (props: Props) => {
	const { legend, dateField, hourField, minuteField, minuteOptions } = props;
	const id = useId();

	return (
		<fieldset className="flex flex-col gap-1">
			<legend className="text-sm font-medium text-gray-800">{legend}</legend>
			<div className="flex flex-wrap gap-1">
				<label htmlFor={`${id}-date`} className="sr-only">
					{legend} 날짜
				</label>
				<input id={`${id}-date`} type="date" className={SELECT_CLASS} {...dateField} />
				<label htmlFor={`${id}-hour`} className="sr-only">
					{legend} 시
				</label>
				<select id={`${id}-hour`} className={SELECT_CLASS} {...hourField}>
					{HOUR_OPTIONS.map(hour => (
						<option key={hour} value={hour}>
							{hour}
						</option>
					))}
				</select>
				<label htmlFor={`${id}-minute`} className="sr-only">
					{legend} 분
				</label>
				<select id={`${id}-minute`} className={SELECT_CLASS} {...minuteField}>
					{minuteOptions.map(minute => (
						<option key={minute} value={minute}>
							{minute}
						</option>
					))}
				</select>
			</div>
		</fieldset>
	);
};

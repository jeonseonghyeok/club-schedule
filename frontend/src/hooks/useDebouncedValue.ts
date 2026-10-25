import { useEffect, useState } from 'react';

/** value 가 delayMs 동안 바뀌지 않으면 그 값을 돌려준다(검색어 입력 등) */
export const useDebouncedValue = <T>(value: T, delayMs: number): T => {
	const [debounced, setDebounced] = useState(value);

	useEffect(() => {
		const timer = setTimeout(() => setDebounced(value), delayMs);
		return () => clearTimeout(timer);
	}, [value, delayMs]);

	return debounced;
};

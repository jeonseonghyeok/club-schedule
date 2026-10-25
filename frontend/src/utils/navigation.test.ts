import { getSafeReturnPath } from '@/utils/navigation';

describe('getSafeReturnPath', () => {
	it.each(['/', '/groups/4', '/groups/4?tab=schedule'])('같은 출처 경로 %s 는 그대로 쓴다', path => {
		expect(getSafeReturnPath(path)).toBe(path);
	});

	it.each([undefined, '', 'groups/4', '//evil.com', '/\\evil.com', 'https://evil.com'])(
		'외부로 나갈 수 있는 값 %s 는 기본 경로로 바꾼다',
		value => {
			expect(getSafeReturnPath(value)).toBe('/');
		},
	);
});

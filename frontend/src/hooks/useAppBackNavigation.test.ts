import { getRootHref, isRoot } from '@/hooks/useAppBackNavigation';

describe('앱 루트 판단', () => {
	it('모요라는 홈, 모임 전용 앱은 그 모임의 홈 탭이 루트다', () => {
		expect(getRootHref('/groups/4')).toBe('/?list=1');
		expect(getRootHref('/g/6/')).toBe('/g/6/');
		expect(getRootHref('/g/6/')).not.toBe(getRootHref('/g/60/'));

		expect(isRoot({ pathname: '/', search: '?list=1' })).toBe(true);
		expect(isRoot({ pathname: '/groups/4', search: '' })).toBe(false);
		expect(isRoot({ pathname: '/g/6/', search: '' })).toBe(true);
		expect(isRoot({ pathname: '/g/6/', search: '?tab=home' })).toBe(true);
		expect(isRoot({ pathname: '/g/6/', search: '?tab=schedule' })).toBe(false);
	});
});

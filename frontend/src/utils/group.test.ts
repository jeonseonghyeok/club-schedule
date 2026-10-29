import type { Group } from '@/types/Group';
import { formatMemberCount, getDescriptionPreview, sortFavoriteFirst } from '@/utils/group';

const group = (groupId: number): Group => ({
	groupId,
	name: `모임${groupId}`,
	description: null,
	leaderUserKey: null,
	capacity: 10,
	currentMemberCount: 3,
	appEnabled: null,
});

describe('group utils', () => {
	it('즐겨찾기 모임을 맨 앞으로, 나머지는 원래 순서대로', () => {
		const sorted = sortFavoriteFirst([group(1), group(2), group(3)], 3);
		expect(sorted.map(g => g.groupId)).toEqual([3, 1, 2]);
	});

	it('즐겨찾기가 없으면 순서를 바꾸지 않는다', () => {
		expect(sortFavoriteFirst([group(2), group(1)], null).map(g => g.groupId)).toEqual([2, 1]);
	});

	it('인원 수가 없으면 0명으로 표시한다', () => {
		expect(formatMemberCount({ currentMemberCount: null, capacity: 50 })).toBe('0명 / 50명');
	});

	it('설명은 40자까지, 없으면 대체 문구', () => {
		expect(getDescriptionPreview('가'.repeat(50))).toHaveLength(40);
		expect(getDescriptionPreview(null)).toBe('설명 없음');
		expect(getDescriptionPreview('')).toBe('설명 없음');
	});
});

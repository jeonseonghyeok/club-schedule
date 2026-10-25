import type { Group } from '@/types/Group';

const UNTITLED_GROUP = '무제 모임';

export const getGroupName = (group: Pick<Group, 'name'>): string => group.name || UNTITLED_GROUP;

export const getGroupPath = (groupId: number): string => `/groups/${groupId}`;

/** 즐겨찾기 모임을 맨 위로. 나머지는 서버 순서를 유지한다(안정 정렬) */
export const sortFavoriteFirst = (groups: readonly Group[], favoriteGroupId: number | null): Group[] =>
	[...groups].sort((a, b) => Number(b.groupId === favoriteGroupId) - Number(a.groupId === favoriteGroupId));

export const isLeaderOfAny = (groups: readonly Group[], userKey: number): boolean =>
	groups.some(group => group.leaderUserKey === userKey);

export const formatMemberCount = (group: Pick<Group, 'currentMemberCount' | 'capacity'>): string =>
	`${group.currentMemberCount ?? 0}명 / ${group.capacity ?? 0}명`;

const DESCRIPTION_PREVIEW_LENGTH = 40;

export const getDescriptionPreview = (description: string | null): string =>
	description?.slice(0, DESCRIPTION_PREVIEW_LENGTH) || '설명 없음';

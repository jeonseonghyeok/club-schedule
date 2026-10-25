/** GroupVo — /api/groups/me, /api/groups/recommended 응답 항목 */
export interface Group {
	readonly groupId: number;
	readonly name: string | null;
	readonly description: string | null;
	readonly leaderUserKey: number | null;
	readonly capacity: number | null;
	readonly currentMemberCount: number | null;
}

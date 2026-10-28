/** GroupVo — /api/groups/me, /api/groups/recommended 응답 항목 */
export interface Group {
	readonly groupId: number;
	readonly name: string | null;
	readonly description: string | null;
	readonly leaderUserKey: number | null;
	readonly capacity: number | null;
	readonly currentMemberCount: number | null;
}

/** GET /api/groups/me 항목 — 내 모임에만 있는 값이 더 있다 */
export interface MyGroup extends Group {
	/** 회원 본인의 모임 닉네임 수정 허용(꺼져 있으면 리더만) */
	readonly allowSelfNickname: boolean | null;
	readonly regionName: string | null;
	/** 이 모임에서 내 닉네임(없으면 계정 닉네임이 보인다) */
	readonly myNickname: string | null;
}

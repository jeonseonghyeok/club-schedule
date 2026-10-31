/** 닉네임 변경 이력 한 건 — groupId 가 null 이면 계정 닉네임 */
export interface NicknameHistory {
	readonly historyId: number;
	readonly userKey: number;
	readonly groupId: number | null;
	/** 내 이력(GET /api/users/me/nickname-history)에서만 채워진다 */
	readonly groupName: string | null;
	readonly oldNickname: string | null;
	readonly newNickname: string | null;
	readonly changedBy: number;
	/** 바꾼 사람의 지금 이름 */
	readonly changedByName: string | null;
	readonly createdAt: string;
}

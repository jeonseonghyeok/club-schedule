export const ROLE = { ADMIN: 'ROLE_ADMIN', USER: 'ROLE_USER' } as const;
export type Role = (typeof ROLE)[keyof typeof ROLE];

export interface GrantedAuthority {
	readonly authority: Role;
}

/** GET /api/auth/me — 인증된 요청은 항상 Spring Security 컨텍스트에서 응답한다 */
export interface AuthMe {
	readonly userKey: number;
	readonly nickname: string | null;
	readonly roles: readonly GrantedAuthority[];
	readonly isAdmin: boolean;
	/** 즐겨찾기(우선) 모임 — 있으면 메인 진입 시 그 모임 화면으로 이동한다 */
	readonly favoriteGroupId: number | null;
}

/** GET /api/login/test/accounts — 개발 환경 전용 테스트 계정 */
export interface TestAccount {
	readonly kakaoApiId: number;
	readonly nickname: string;
}

/** POST /api/login/test 응답 */
export interface TestLoginResult {
	readonly userKey: number;
	readonly nickname: string;
}

/** POST /api/login/kakao 요청 — redirectUri 는 인가 요청 때와 같아야 한다 */
export interface KakaoLoginRequest {
	readonly code: string;
	readonly redirectUri: string;
	readonly returnTo: string;
}

/** PATCH /api/users/me 요청 — groupIds 의 내 모임 닉네임도 같은 이름으로 바꾼다 */
export interface AccountNicknameRequest {
	readonly nickname: string;
	readonly groupIds: readonly number[];
}

/** PATCH /api/users/me 응답 — 모임마다 따로 저장해, 바꾸지 못한 모임은 skipped 에 이유와 함께 온다 */
export interface AccountNickname {
	readonly nickname: string;
	readonly updated: readonly { readonly groupId: number; readonly groupNickname: string }[];
	readonly skipped: readonly { readonly groupId: number; readonly message: string }[];
}

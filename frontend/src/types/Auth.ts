export const ROLE = { ADMIN: 'ROLE_ADMIN', USER: 'ROLE_USER' } as const;
export type Role = (typeof ROLE)[keyof typeof ROLE];

export interface GrantedAuthority {
	readonly authority: Role;
}

/** GET /api/auth/me — 인증된 요청은 항상 Spring Security 컨텍스트에서 응답한다 */
export interface AuthMe {
	readonly userKey: number;
	readonly roles: readonly GrantedAuthority[];
	readonly isAdmin: boolean;
}

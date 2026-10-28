package com.moyora.clubschedule.security;

public class WhitelistConfig {
    public static final String[] AUTH_WHITELIST = {
        // 화면은 모두 프론트엔드(SPA)가 서빙한다 — 백엔드는 /api 만 받고, 로그인 API 만 토큰 없이 허용
        "/api/login/**",
        // 토큰이 만료돼도 쿠키를 지울 수 있어야 한다
        "/api/auth/logout"
    };

    /**
     * 로그인하지 않아도 볼 수 있는 조회(GET 만). 토큰이 있으면 로그인 사용자로 처리하고, 없거나 만료됐으면 비회원으로 통과한다.
     * 비회원에게 보이는 일정 범위는 모임의 공개 범위(visibility_type)를 따른다(GroupScheduleService.listSchedules).
     * {groupId} 는 숫자만 — /api/groups/me 같은 로그인 전용 경로와 겹치지 않게 한다.
     */
    public static final String[] PUBLIC_GET = {
        "/api/groups/recommended",
        "/api/groups/{groupId:[0-9]+}",
        "/api/groups/{groupId:[0-9]+}/schedules",
        "/api/map/groups"
    };
}

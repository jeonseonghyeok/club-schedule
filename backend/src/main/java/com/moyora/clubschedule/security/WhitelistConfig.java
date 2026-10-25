package com.moyora.clubschedule.security;

public class WhitelistConfig {
    public static final String[] AUTH_WHITELIST = {
        // 화면은 모두 프론트엔드(SPA)가 서빙한다 — 백엔드는 /api 만 받고, 로그인 API 만 토큰 없이 허용
        "/api/login/**"
    };
}
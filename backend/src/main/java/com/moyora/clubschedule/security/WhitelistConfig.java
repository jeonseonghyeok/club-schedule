package com.moyora.clubschedule.security;

public class WhitelistConfig {
    public static final String[] AUTH_WHITELIST = {
        "/",
        "/admin",
        "/admin/**",
        "/login/**",
        "/api/login/**",
        "/sample/**",
        "/favicon.ico",
        "/.well-known/**",
        "/css/**",
        "/js/**"
    };
}
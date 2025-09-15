package com.moyora.clubschedule.security;

public class WhitelistConfig {
    public static final String[] AUTH_WHITELIST = { "/login/**", "/sample/**","/favicon.ico","/.well-known/**"};
}
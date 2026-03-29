package com.moyora.clubschedule.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.util.AntPathMatcher;
import org.springframework.web.filter.OncePerRequestFilter;

import com.moyora.clubschedule.util.KakaoTokenUtil;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.nio.charset.StandardCharsets;

public class JwtAuthenticationFilter extends OncePerRequestFilter {
    private static final Logger logger = LoggerFactory.getLogger(JwtAuthenticationFilter.class);

	private final KakaoTokenUtil kakaoTokenUtil;

    public JwtAuthenticationFilter(KakaoTokenUtil kakaoTokenUtil) {
        this.kakaoTokenUtil = kakaoTokenUtil;
    }


    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        // 화이트리스트 경로는 인증 검사/401 방지: 그대로 chain.doFilter() 호출
        String uri = request.getRequestURI();
        if (isWhiteList(uri)) {
            chain.doFilter(request, response);
            return;
        }

        // CORS 프리플라이트는 인증 필요 없음
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            chain.doFilter(request, response);
            return;
        }

        // 이미 인증이 설정되어 있으면 덮어쓰지 않음
        Authentication existingAuth = SecurityContextHolder.getContext().getAuthentication();
        if (existingAuth != null && existingAuth.isAuthenticated()) {
            logger.debug("Existing authentication present - skipping JWT processing for uri={}", uri);
            chain.doFilter(request, response);
            return;
        }

        String header = request.getHeader("Authorization");

        if (header == null || !header.startsWith("Bearer ")) {
            // 시도: 쿠키에서 AUTH_TOKEN 읽기
            jakarta.servlet.http.Cookie[] cookies = request.getCookies();
            if (cookies != null) {
                for (jakarta.servlet.http.Cookie c : cookies) {
                    if ("AUTH_TOKEN".equals(c.getName()) && c.getValue() != null && !c.getValue().isEmpty()) {
                        // Prefer the raw value provided by Kakao (do not alter token). Only decode if it appears percent-encoded.
                        String cookieVal = c.getValue();
                        String tokenCandidate = cookieVal;
                        if (cookieVal.indexOf('%') >= 0 || cookieVal.indexOf('+') >= 0) {
                            try {
                                tokenCandidate = java.net.URLDecoder.decode(cookieVal, StandardCharsets.UTF_8.name());
                            } catch (IllegalArgumentException | java.io.UnsupportedEncodingException e) {
                                logger.warn("Failed to decode AUTH_TOKEN cookie; using raw value for uri={}: {}", uri, e.getMessage());
                                tokenCandidate = cookieVal; // fallback to raw
                            }
                        }
                        header = "Bearer " + tokenCandidate;
                        break;
                    }
                }
            }
        }

        if (header == null || !header.startsWith("Bearer ")) {
            // JWT 없으면 인증 실패(401)
            logger.debug("Missing or invalid Authorization header for uri={}", uri);
            sendUnauthorized(response, "Missing or invalid Authorization header");
            return;
        }

        String token = header.substring(7);

        try {
            // 1. 토큰 유효성 검사 및 kakaoApiId 획득 (public-key로 서명 검증 포함)
            Long kakaoApiId = kakaoTokenUtil.validateAndGetUserId(token);
            if (kakaoApiId == null) {
                logger.warn("Token validation failed or user id missing for uri={}", uri);
                sendUnauthorized(response, "Invalid or expired token");
                return;
            }

            // 2. 토큰 클레임 기반으로 Authentication 생성 (DB 조회 없이)
            Authentication authentication = kakaoTokenUtil.getAuthentication(kakaoApiId);
            if (authentication == null || !authentication.isAuthenticated()) {
                logger.warn("Failed to build Authentication from token for kakaoApiId={} uri={}", kakaoApiId, uri);
                sendUnauthorized(response, "Invalid authentication");
                return;
            }

            SecurityContextHolder.getContext().setAuthentication(authentication);
            logger.debug("Authentication set for kakaoApiId={} uri={}", kakaoApiId, uri);

            chain.doFilter(request, response);
        } catch (Exception ex) {
            // kakaoTokenUtil 내부에서 발생한 예외 등 모든 예외를 잡아 401로 응답
            logger.error("Error during JWT authentication for uri={}: {}", uri, ex.getMessage(), ex);
            SecurityContextHolder.clearContext();
            sendUnauthorized(response, "Authentication error");
        }
    }

    private static final String[] AUTH_WHITELIST = WhitelistConfig.AUTH_WHITELIST;

    public boolean isWhiteList(String uri) {
        AntPathMatcher matcher = new AntPathMatcher();
        for (String pattern : AUTH_WHITELIST) {
            if (matcher.match(pattern, uri)) return true;
        }
        return false;
    }

    private void sendUnauthorized(HttpServletResponse response, String message) throws IOException {
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setCharacterEncoding(StandardCharsets.UTF_8.name());
        response.setContentType("application/json;charset=UTF-8");
        String body = String.format("{\"error\":\"Unauthorized\",\"message\":\"%s\"}", escapeJson(message));
        response.getWriter().write(body);
    }

    // 매우 단순한 JSON 문자열 이스케이프 (기본적인 보호용)
    private String escapeJson(String s) {
        if (s == null) return "";
        return s.replace("\\", "\\\\").replace("\"", "\\\"").replace("\n", "\\n").replace("\r", "\\r");
    }
}
package com.moyora.clubschedule.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.util.AntPathMatcher;
import org.springframework.web.filter.OncePerRequestFilter;

import com.moyora.clubschedule.service.UserService;
import com.moyora.clubschedule.util.KakaoTokenUtil;
import com.moyora.clubschedule.util.TestAuthUtil;
import com.moyora.clubschedule.vo.UserVo;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.nio.charset.StandardCharsets;

public class JwtAuthenticationFilter extends OncePerRequestFilter {
    private static final Logger logger = LoggerFactory.getLogger(JwtAuthenticationFilter.class);

    private final KakaoTokenUtil kakaoTokenUtil;
    private final TestAuthUtil   testAuthUtil;
    private final UserService    userService;

    public JwtAuthenticationFilter(KakaoTokenUtil kakaoTokenUtil,
                                   TestAuthUtil testAuthUtil,
                                   UserService userService) {
        this.kakaoTokenUtil = kakaoTokenUtil;
        this.testAuthUtil   = testAuthUtil;
        this.userService    = userService;
    }


    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        // 이전: 화이트리스트 경로는 인증 검사/401 방지: 그대로 chain.doFilter() 호출
        // 변경: 화이트리스트 경로더라도 가능하면 토큰 기반 인증을 시도하되, 토큰이 없으면 인증 없이 통과시킨다.
        String uri = request.getRequestURI();
        boolean isWhite = isWhiteList(uri) || isPublicGet(request.getMethod(), uri);

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
            // JWT 없으면 인증 실패(401) 또는 화이트리스트일 경우 인증없이 통과
            if (isWhite) {
                // 허용 경로이므로 인증 없이 계속 진행
                chain.doFilter(request, response);
                return;
            }
            logger.debug("Missing or invalid Authorization header for uri={}", uri);
            sendUnauthorized(response, "로그인이 필요합니다.");
            return;
        }

        String token = header.substring(7);

        // 인증 정보 확인만 try 안에서 한다. 체인 진행(chain.doFilter)을 try 안에 두면 컨트롤러·응답 쓰기
        // 단계에서 난 예외까지 잡아 로그인한 사용자에게 401 을 주거나, 허용 경로 요청을 두 번 실행하게 된다.
        Authentication authentication = null;
        try {
            // 1. 카카오 JWT 검증 시도
            Long kakaoApiId = kakaoTokenUtil.validateAndGetUserId(token);

            if (kakaoApiId != null) {
                // 1a. 카카오 토큰: kakaoApiId → userKey → Authentication
                authentication = kakaoTokenUtil.getAuthentication(kakaoApiId);
                logger.debug("Kakao auth for kakaoApiId={} uri={}", kakaoApiId, uri);
            } else if (testAuthUtil != null && testAuthUtil.isEnabled()) {
                // 1b. 테스트 토큰 fallback: sub = userKey
                Long userKey = testAuthUtil.validateToken(token);
                if (userKey != null) {
                    UserVo userVo = userService.getUserByUserKey(userKey);
                    if (userVo != null) {
                        java.util.List<org.springframework.security.core.authority.SimpleGrantedAuthority> auths =
                                new java.util.ArrayList<>();
                        if ("ADMIN".equalsIgnoreCase(userVo.getSystemRole())) {
                            auths.add(new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_ADMIN"));
                        }
                        auths.add(new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_USER"));
                        CustomUserDetails ud = new CustomUserDetails(userKey, auths);
                        authentication = new org.springframework.security.authentication
                                .UsernamePasswordAuthenticationToken(ud, null, ud.getAuthorities());
                        logger.debug("Test auth for userKey={} uri={}", userKey, uri);
                    }
                }
            }

        } catch (Exception ex) {
            // kakaoTokenUtil 내부에서 발생한 예외 등 — 인증 실패로 다룬다
            logger.error("Error during JWT authentication for uri={}: {}", uri, ex.getMessage(), ex);
            authentication = null;
        }

        if (authentication == null || !authentication.isAuthenticated()) {
            logger.warn("Token validation failed for uri={}", uri);
            SecurityContextHolder.clearContext();
            if (isWhite) {
                // 허용 경로라면 인증 없이 통과
                chain.doFilter(request, response);
                return;
            }
            sendUnauthorized(response, "로그인이 만료되었습니다. 다시 로그인해 주세요.");
            return;
        }

        SecurityContextHolder.getContext().setAuthentication(authentication);
        chain.doFilter(request, response);
    }

    private static final String[] AUTH_WHITELIST = WhitelistConfig.AUTH_WHITELIST;

    private static final AntPathMatcher PATH_MATCHER = new AntPathMatcher();

    public boolean isWhiteList(String uri) {
        for (String pattern : AUTH_WHITELIST) {
            if (PATH_MATCHER.match(pattern, uri)) return true;
        }
        return false;
    }

    private static final String[] PUBLIC_GET = WhitelistConfig.PUBLIC_GET;

    /** 비회원도 볼 수 있는 조회(GET) — 토큰이 없거나 만료돼도 401 을 주지 않는다 */
    public boolean isPublicGet(String method, String uri) {
        if (!"GET".equalsIgnoreCase(method)) return false;
        for (String pattern : PUBLIC_GET) {
            if (PATH_MATCHER.match(pattern, uri)) return true;
        }
        return false;
    }

    private void sendUnauthorized(HttpServletResponse response, String message) throws IOException {
        // 화면은 프론트엔드가 서빙하므로 항상 JSON 401 을 준다(로그인 안내는 화면이 처리)
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
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

import java.io.IOException;
public class JwtAuthenticationFilter extends OncePerRequestFilter {
	private final KakaoTokenUtil kakaoTokenUtil;
    private final UserService userService; // UserService 의존성 주입

    public JwtAuthenticationFilter(KakaoTokenUtil kakaoTokenUtil, UserService userService) {
        this.kakaoTokenUtil = kakaoTokenUtil;
        this.userService = userService;
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
        String header = request.getHeader("Authorization");

        if (header == null || !header.startsWith("Bearer ")) {
            // JWT 없으면 인증 실패(401)
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            return;
        }

        String token = header.substring(7);

        // 1. 토큰 유효성 검사 및 kakaoApiId 획득
        Long kakaoApiId = kakaoTokenUtil.validateAndGetUserId(token);
        if (kakaoApiId == null) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            return;
        }

        // 2. kakaoApiId로 userKey 조회
        Long userKey = userService.findUserKeyByKakaoApiId(kakaoApiId);
        if (userKey == null) {
            // DB에 없는 사용자라면 (자동 회원가입 로직이 필요)
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            return;
        }

        // 3. userKey 기반 인증 객체 생성 및 SecurityContext 설정
        Authentication authentication = kakaoTokenUtil.getAuthentication(userKey);
        SecurityContextHolder.getContext().setAuthentication(authentication);

        chain.doFilter(request, response);
    }
    private static final String[] AUTH_WHITELIST = WhitelistConfig.AUTH_WHITELIST;

    public boolean isWhiteList(String uri) {
        AntPathMatcher matcher = new AntPathMatcher();
        for (String pattern : AUTH_WHITELIST) {
            if (matcher.match(pattern, uri)) return true;
        }
        return false;
    }
}


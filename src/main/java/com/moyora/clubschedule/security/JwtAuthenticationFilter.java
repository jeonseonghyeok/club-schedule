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

import java.io.IOException;
public class JwtAuthenticationFilter extends OncePerRequestFilter {
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
        String header = request.getHeader("Authorization");

        if (header == null || !header.startsWith("Bearer ")) {
            // JWT 없으면 인증 실패(401)
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            return;
        }

        String token = header.substring(7);

        // 카카오 API로 유효성 검사(이 과정에서 userId도 받아온다)
        Long userId = kakaoTokenUtil.validateAndGetUserId(token);
        if (userId == null) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            return;
        }

        // 인증 객체 생성 (network 사용 X)
        Authentication authentication = kakaoTokenUtil.getAuthentication(userId);
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


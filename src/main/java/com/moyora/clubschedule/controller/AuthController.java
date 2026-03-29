package com.moyora.clubschedule.controller;

import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import com.moyora.clubschedule.security.CustomUserDetails;
import com.moyora.clubschedule.util.KakaoTokenUtil;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;

@RestController
public class AuthController {

    @Autowired
    private KakaoTokenUtil kakaoTokenUtil;

    @GetMapping("/auth/me")
    public ResponseEntity<?> me(@AuthenticationPrincipal CustomUserDetails userDetails, HttpServletRequest request) {
        // If Spring Security already set the principal, prefer that
        if (userDetails != null) {
            Map<String, Object> resp = new HashMap<>();
            resp.put("userKey", userDetails.getUserKey());
            resp.put("roles", userDetails.getAuthorities());
            boolean isAdmin = userDetails.getAuthorities().stream()
                    .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
            resp.put("isAdmin", isAdmin);
            resp.put("source", "securityContext");
            return ResponseEntity.ok(resp);
        }

        // Fallback: try to read AUTH_TOKEN cookie and validate it
        Cookie[] cookies = request.getCookies();
        if (cookies == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "no_cookie"));
        }

        String token = null;
        for (Cookie c : cookies) {
            if ("AUTH_TOKEN".equals(c.getName())) {
                token = c.getValue();
                break;
            }
        }

        if (token == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "no_auth_token"));
        }

        // Try decode (cookie might be URL encoded)
        try {
            token = URLDecoder.decode(token, StandardCharsets.UTF_8.name());
        } catch (Exception ignored) {
        }

        Long kakaoApiId = kakaoTokenUtil.validateAndGetUserId(token);
        if (kakaoApiId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "invalid_token"));
        }

        Map<String, Object> resp = new HashMap<>();
        resp.put("kakaoApiId", kakaoApiId);
        // We don't perform DB lookup here: client only needs to know authenticated identity
        resp.put("roles", List.of("ROLE_USER"));
        resp.put("isAdmin", false);
        resp.put("source", "cookie");
        return ResponseEntity.ok(resp);
    }
}

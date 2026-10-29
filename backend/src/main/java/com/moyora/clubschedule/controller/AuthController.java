package com.moyora.clubschedule.controller;

import java.util.HashMap;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RestController;

import com.moyora.clubschedule.security.CustomUserDetails;
import com.moyora.clubschedule.service.UserService;
import com.moyora.clubschedule.vo.UserVo;


@RestController
public class AuthController {

    @Autowired
    private UserService userService;

    /**
     * 로그인 사용자 정보. 비회원(토큰 없음·만료)도 들어올 수 있는 공개 경로라 204 를 준다 — 로그인 여부 확인이
     * 오류가 아니도록(화면은 204 를 "로그인 안 됨"으로 본다).
     */
    @GetMapping("/api/auth/me")
    public ResponseEntity<?> me(@AuthenticationPrincipal CustomUserDetails userDetails) {
        if (userDetails == null) return ResponseEntity.noContent().build();
        Map<String, Object> resp = new HashMap<>();
        resp.put("userKey", userDetails.getUserKey());
        resp.put("roles", userDetails.getAuthorities());
        boolean isAdmin = userDetails.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        resp.put("isAdmin", isAdmin);
        // 메인 화면(SPA)이 헤더 표시와 즐겨찾기 모임 자동 이동에 쓴다
        UserVo user = userService.getUserByUserKey(userDetails.getUserKey());
        resp.put("nickname", user != null ? user.getNickname() : null);
        resp.put("favoriteGroupId", user != null ? user.getFavoriteGroupId() : null);
        resp.put("source", "securityContext");
        return ResponseEntity.ok(resp);
    }

    /**
     * 로그아웃 — httpOnly AUTH_TOKEN 쿠키는 스크립트로 지울 수 없어 서버가 만료 쿠키로 덮어쓴다.
     * 토큰이 이미 만료된 경우에도 호출할 수 있게 인증 없이 허용한다(WhitelistConfig).
     */
    @PostMapping("/api/auth/logout")
    public ResponseEntity<?> logout() {
        return ResponseEntity.noContent()
                .header(HttpHeaders.SET_COOKIE, "AUTH_TOKEN=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0")
                .build();
    }
}

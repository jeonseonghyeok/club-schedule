package com.moyora.clubschedule.controller;

import java.util.HashMap;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import com.moyora.clubschedule.security.CustomUserDetails;
import com.moyora.clubschedule.service.UserService;
import com.moyora.clubschedule.vo.UserVo;


@RestController
public class AuthController {

    @Autowired
    private UserService userService;

    /**
     * 로그인 사용자 정보. 토큰이 없거나 유효하지 않으면 JwtAuthenticationFilter 가 먼저 401 을 준다
     * (이 경로는 화이트리스트가 아니므로 여기까지 오면 항상 인증된 요청이다).
     */
    @GetMapping("/api/auth/me")
    public ResponseEntity<?> me(@AuthenticationPrincipal CustomUserDetails userDetails) {
        if (userDetails == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Unauthorized", "message", "로그인이 필요합니다."));
        }
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
}

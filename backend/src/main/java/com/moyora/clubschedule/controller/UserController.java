package com.moyora.clubschedule.controller;

import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import com.moyora.clubschedule.exception.ApiErrors;
import com.moyora.clubschedule.security.CustomUserDetails;
import com.moyora.clubschedule.service.UserService;

import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
public class UserController {

    private static final int NICKNAME_MAX = 30;

    private final UserService userService;

    /** 계정 닉네임 변경 — Body {nickname}(1~30자). 모임 닉네임이 없는 모임에서는 이 이름이 보인다 */
    @PatchMapping("/api/users/me")
    public ResponseEntity<?> updateMe(
            @RequestBody(required = false) Map<String, Object> payload,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        if (userDetails == null) return ApiErrors.unauthorized();
        Object raw = payload != null ? payload.get("nickname") : null;
        String nickname = raw != null ? raw.toString().trim() : "";
        if (nickname.isEmpty() || nickname.length() > NICKNAME_MAX) {
            return ApiErrors.badRequest("닉네임은 1~30자로 입력하세요.");
        }
        userService.updateNickname(userDetails.getUserKey(), nickname);
        return ResponseEntity.ok(Map.of("nickname", nickname));
    }
}

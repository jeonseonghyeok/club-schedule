package com.moyora.clubschedule.controller;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import com.moyora.clubschedule.exception.ApiErrors;
import com.moyora.clubschedule.security.CustomUserDetails;
import com.moyora.clubschedule.service.GroupManageService;
import com.moyora.clubschedule.service.NicknameService;

import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
public class UserController {

    private final NicknameService nicknameService;

    /**
     * 계정 닉네임 변경 — Body {nickname(1~10자), groupIds?: 같은 이름으로 바꿀 내 모임}.
     * 모임 닉네임은 모임마다 따로라 계정 이름만 바꾸면 모임에서 보이는 이름은 그대로다.
     * 응답 {nickname, updated:[{groupId, groupNickname}], skipped:[{groupId, message}]}
     */
    @PatchMapping("/api/users/me")
    public ResponseEntity<?> updateMe(
            @RequestBody(required = false) Map<String, Object> payload,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        if (userDetails == null) return ApiErrors.unauthorized();
        Object raw = payload != null ? payload.get("nickname") : null;
        String nickname = raw != null ? raw.toString().trim() : "";
        if (nickname.isEmpty() || nickname.length() > GroupManageService.NICKNAME_MAX) {
            return ApiErrors.badRequest("닉네임은 1~" + GroupManageService.NICKNAME_MAX + "자로 입력하세요.");
        }
        List<Long> groupIds = new ArrayList<>();
        if (payload != null && payload.get("groupIds") instanceof List<?> ids) {
            for (Object id : ids) {
                if (!(id instanceof Number n)) return ApiErrors.badRequest("groupIds 는 모임 번호 목록이어야 합니다.");
                groupIds.add(n.longValue());
            }
        }
        Long userKey = userDetails.getUserKey();
        nicknameService.updateAccountNickname(userKey, nickname);
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("nickname", nickname);
        body.putAll(nicknameService.applyToGroups(userKey, nickname, groupIds));
        return ResponseEntity.ok(body);
    }

    /** 내 닉네임 변경 이력 — 계정(groupId=null)과 모든 모임, 최신순 */
    @GetMapping("/api/users/me/nickname-history")
    public ResponseEntity<?> myNicknameHistory(@AuthenticationPrincipal CustomUserDetails userDetails) {
        if (userDetails == null) return ApiErrors.unauthorized();
        return ResponseEntity.ok(nicknameService.getMyHistory(userDetails.getUserKey()));
    }
}

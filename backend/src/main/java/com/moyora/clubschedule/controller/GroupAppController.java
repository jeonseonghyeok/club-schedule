package com.moyora.clubschedule.controller;

import java.util.Map;

import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import com.moyora.clubschedule.exception.ApiErrors;
import com.moyora.clubschedule.service.GroupAppService;
import com.moyora.clubschedule.service.GroupManageService;

import lombok.RequiredArgsConstructor;

/** 모임 전용 앱(모임별 PWA) */
@RestController
@RequiredArgsConstructor
public class GroupAppController {

    private static final MediaType MANIFEST_TYPE = MediaType.parseMediaType("application/manifest+json");

    private final GroupAppService groupAppService;
    private final GroupManageService groupManageService;

    /** 시스템 관리자: 켜기/끄기 — Body {enabled, iconPng?(base64)} */
    @PreAuthorize("hasRole('ADMIN')")
    @PatchMapping("/api/admin/groups/{groupId}/app")
    public ResponseEntity<?> setEnabled(@PathVariable Long groupId, @RequestBody Map<String, Object> body) {
        boolean enabled = Boolean.TRUE.equals(body.get("enabled"));
        Object icon = body.get("iconPng");
        try {
            if (!groupAppService.setEnabled(groupId, enabled, icon != null ? icon.toString() : null)) {
                return ApiErrors.notFound("모임을 찾을 수 없습니다.");
            }
        } catch (IllegalArgumentException e) {
            return ApiErrors.badRequest(e.getMessage());
        }
        return ResponseEntity.ok(Map.of("groupId", groupId, "appEnabled", enabled));
    }

    /** 리더·매니저: 앱 이름·홈 화면 이름·대표 색·아이콘 — Body {appName, appShortName, themeColor, iconPng?}. 저장 후 설정 전체를 돌려준다 */
    @PreAuthorize("@groupManageService.isManager(#groupId, principal.userKey)")
    @PutMapping("/api/groups/{groupId}/app")
    public ResponseEntity<?> updateBranding(@PathVariable Long groupId, @RequestBody Map<String, Object> body) {
        Object name = body.get("appName");
        Object shortName = body.get("appShortName");
        Object color = body.get("themeColor");
        Object icon = body.get("iconPng");
        try {
            if (!groupAppService.updateBranding(groupId,
                    name != null ? name.toString() : null,
                    shortName != null ? shortName.toString() : null,
                    color != null ? color.toString() : null,
                    icon != null ? icon.toString() : null)) {
                return ApiErrors.notFound("모임을 찾을 수 없습니다.");
            }
        } catch (IllegalArgumentException e) {
            return ApiErrors.badRequest(e.getMessage());
        }
        return ResponseEntity.ok(groupManageService.getSettings(groupId));
    }

    /** 공개: 전용 앱 매니페스트 — /g/{groupId}/ 화면이 링크한다 */
    @GetMapping("/api/groups/{groupId}/app-manifest")
    public ResponseEntity<?> manifest(@PathVariable Long groupId) {
        Map<String, Object> manifest = groupAppService.buildManifest(groupId);
        if (manifest == null) return ApiErrors.notFound("전용 앱이 없는 모임입니다.");
        return ResponseEntity.ok().contentType(MANIFEST_TYPE).cacheControl(CacheControl.noCache()).body(manifest);
    }

    /** 공개: 전용 앱 아이콘(512px PNG). 주소에 갱신 시각이 붙어 바뀌면 새로 받는다 */
    @GetMapping("/api/groups/{groupId}/app-icon.png")
    public ResponseEntity<?> icon(@PathVariable Long groupId) {
        byte[] png = groupAppService.getIcon(groupId);
        if (png == null) return ApiErrors.notFound("아이콘이 없습니다.");
        return ResponseEntity.ok()
                .contentType(MediaType.IMAGE_PNG)
                .cacheControl(CacheControl.maxAge(java.time.Duration.ofDays(30)).cachePublic())
                .body(png);
    }
}

package com.moyora.clubschedule.controller;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.moyora.clubschedule.security.CustomUserDetails;
import com.moyora.clubschedule.service.NotificationService;
import com.moyora.clubschedule.vo.NotificationListItem;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationApiController {

    private final NotificationService notificationService;

    /** 내 알림 목록 — 최신순, 페이지네이션 없이 최근 N건(기본 20, 최대 30) */
    @GetMapping
    public ResponseEntity<?> list(
            @RequestParam(required = false) Integer limit,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        Long userKey = userKey(userDetails);
        if (userKey == null) return ResponseEntity.status(401).build();

        List<NotificationListItem> items = notificationService.listRecent(userKey, limit != null ? limit : 20);
        List<Map<String, Object>> result = new ArrayList<>();
        for (NotificationListItem n : items) result.add(toMap(n));
        return ResponseEntity.ok(result);
    }

    /** 안 읽은 알림 수 */
    @GetMapping("/unread-count")
    public ResponseEntity<?> unreadCount(@AuthenticationPrincipal CustomUserDetails userDetails) {
        Long userKey = userKey(userDetails);
        if (userKey == null) return ResponseEntity.status(401).build();
        return ResponseEntity.ok(Map.of("count", notificationService.unreadCount(userKey)));
    }

    /** 단건 읽음 처리 */
    @PatchMapping("/{notificationId}/read")
    public ResponseEntity<?> markRead(
            @PathVariable Long notificationId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        Long userKey = userKey(userDetails);
        if (userKey == null) return ResponseEntity.status(401).build();
        notificationService.markRead(notificationId, userKey);
        return ResponseEntity.ok().build();
    }

    /** 전체 읽음 처리 */
    @PatchMapping("/read-all")
    public ResponseEntity<?> markAllRead(@AuthenticationPrincipal CustomUserDetails userDetails) {
        Long userKey = userKey(userDetails);
        if (userKey == null) return ResponseEntity.status(401).build();
        int updated = notificationService.markAllRead(userKey);
        return ResponseEntity.ok(Map.of("updated", updated));
    }

    // ── helpers ───────────────────────────────────────────────────────────────

    private Long userKey(CustomUserDetails u) {
        return u != null ? u.getUserKey() : null;
    }

    private Map<String, Object> toMap(NotificationListItem n) {
        Map<String, Object> m = new HashMap<>();
        m.put("notificationId", n.getNotificationId());
        m.put("sourceTable",    n.getSourceTable());
        m.put("sourceId",       n.getSourceId());
        m.put("category",       n.getCategory());
        m.put("title",          n.getTitle());
        m.put("content",        n.getContent());
        m.put("isRead",         Boolean.TRUE.equals(n.getIsRead()));
        m.put("createdAt",      n.getCreatedAt() != null ? n.getCreatedAt().toInstant().toString() : null);
        m.put("groupId",        n.getGroupId());
        m.put("targetUrl",      n.getGroupId() != null ? "/groups/" + n.getGroupId() : null);
        return m;
    }
}

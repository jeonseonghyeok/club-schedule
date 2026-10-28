package com.moyora.clubschedule.controller;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.moyora.clubschedule.exception.ApiErrors;
import com.moyora.clubschedule.mapper.MapMapper;
import com.moyora.clubschedule.security.CustomUserDetails;

import lombok.RequiredArgsConstructor;

/** 지도 탭 — 모임 활동 지역 / 내 모임 일정 장소 */
@RestController
@RequestMapping("/api/map")
@RequiredArgsConstructor
public class MapController {

    /** 기간을 주지 않으면 지금부터 90일 */
    private static final int DEFAULT_RANGE_DAYS = 90;
    private static final int MAX_RANGE_DAYS = 366;

    private final MapMapper mapMapper;

    @GetMapping("/groups")
    public ResponseEntity<?> groups(@AuthenticationPrincipal CustomUserDetails userDetails) {
        if (userDetails == null) return ApiErrors.unauthorized();
        List<Map<String, Object>> rows = mapMapper.selectGroupsWithLocation(userDetails.getUserKey());
        for (Map<String, Object> row : rows) {
            row.put("isMember", toBoolean(row.get("isMember")));
            row.put("memberCount", ((Number) row.get("memberCount")).intValue());
        }
        return ResponseEntity.ok(rows);
    }

    /** from/to: epoch ms */
    @GetMapping("/schedules")
    public ResponseEntity<?> schedules(
            @RequestParam(required = false) Long from,
            @RequestParam(required = false) Long to,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        if (userDetails == null) return ApiErrors.unauthorized();
        LocalDateTime start = from != null ? toLocalDateTime(from) : LocalDateTime.now();
        LocalDateTime end = to != null ? toLocalDateTime(to) : start.plusDays(DEFAULT_RANGE_DAYS);
        if (!end.isAfter(start) || end.isAfter(start.plusDays(MAX_RANGE_DAYS))) {
            return ApiErrors.badRequest("기간은 1년 이내로, 끝이 시작보다 뒤여야 합니다.");
        }

        List<Map<String, Object>> result = new ArrayList<>();
        for (Map<String, Object> row : mapMapper.selectMySchedulesWithLocation(userDetails.getUserKey(), start, end)) {
            Map<String, Object> item = new HashMap<>(row);
            LocalDateTime startAt = (LocalDateTime) row.get("startAt");
            item.put("startAt", startAt.toString());
            item.put("start", startAt.atZone(ZoneId.systemDefault()).toInstant().toEpochMilli());
            result.add(item);
        }
        return ResponseEntity.ok(result);
    }

    private static boolean toBoolean(Object value) {
        if (value instanceof Boolean b) return b;
        return value instanceof Number n && n.intValue() != 0;
    }

    private static LocalDateTime toLocalDateTime(long epochMs) {
        return Instant.ofEpochMilli(epochMs).atZone(ZoneId.systemDefault()).toLocalDateTime();
    }
}

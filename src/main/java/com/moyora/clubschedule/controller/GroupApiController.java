package com.moyora.clubschedule.controller;

import java.math.BigDecimal;
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
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.moyora.clubschedule.dto.GroupScheduleCreateDto;
import com.moyora.clubschedule.dto.GroupScheduleEditDto;
import com.moyora.clubschedule.mapper.ScheduleAttendanceMapper;
import com.moyora.clubschedule.security.CustomUserDetails;
import com.moyora.clubschedule.service.GroupManageService;
import com.moyora.clubschedule.service.GroupScheduleService;
import com.moyora.clubschedule.service.GroupService;
import com.moyora.clubschedule.vo.GroupMemberVo;
import com.moyora.clubschedule.vo.GroupScheduleVo;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/groups")
@RequiredArgsConstructor
public class GroupApiController {

    private final GroupService groupService;
    private final GroupManageService groupManageService;
    private final GroupScheduleService groupScheduleService;
    private final ScheduleAttendanceMapper scheduleAttendanceMapper;

    // ── Members ──────────────────────────────────────────────────────────────

    @GetMapping("/{groupId}/members")
    public ResponseEntity<?> members(@PathVariable("groupId") Long groupId) {
        List<GroupMemberVo> members = groupManageService.listMembers(groupId);
        List<Map<String,Object>> out = new ArrayList<>();
        for (GroupMemberVo m : members) {
            Map<String,Object> map = new HashMap<>();
            map.put("userKey",     m.getUserKey());
            map.put("displayName", m.getDisplayName());
            map.put("role",        m.getRole());
            map.put("status",      m.getStatus());
            map.put("joinedAt",    m.getJoinedAt() != null ? m.getJoinedAt().toString() : null);
            out.add(map);
        }
        return ResponseEntity.ok(out);
    }

    @PatchMapping("/{groupId}/members/{userKey}/ban")
    public ResponseEntity<?> banMember(
            @PathVariable("groupId") Long groupId,
            @PathVariable("userKey") Long userKey,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        Long operator = userDetails != null ? userDetails.getUserKey() : null;
        if (operator == null) return ResponseEntity.status(401).build();
        boolean ok = groupManageService.banMember(groupId, userKey, operator);
        return ok ? ResponseEntity.ok().build() : ResponseEntity.status(403).build();
    }

    // ── Schedules ─────────────────────────────────────────────────────────────

    @GetMapping("/{groupId}/schedules")
    public ResponseEntity<?> getSchedules(
            @PathVariable("groupId") Long groupId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        Long userKey = userDetails != null ? userDetails.getUserKey() : null;
        List<GroupScheduleVo> schedules = groupScheduleService.listSchedules(groupId, userKey);
        List<Map<String,Object>> result = new ArrayList<>();
        for (GroupScheduleVo s : schedules) {
            result.add(toCalendarEvent(s));
        }
        return ResponseEntity.ok(result);
    }

    @PostMapping("/{groupId}/schedules")
    public ResponseEntity<?> createSchedule(
            @PathVariable("groupId") Long groupId,
            @RequestBody Map<String,Object> payload,
            @AuthenticationPrincipal CustomUserDetails userDetails) {

        Long operator = userDetails != null ? userDetails.getUserKey() : null;
        if (operator == null) return ResponseEntity.status(401).build();

        if (!groupManageService.isMember(groupId, operator)) {
            return ResponseEntity.status(403).body("그룹 멤버만 일정을 등록할 수 있습니다.");
        }

        String title = getString(payload, "title");
        if (title == null || title.isBlank()) {
            return ResponseEntity.badRequest().body("title은 필수입니다.");
        }

        // start: epoch ms (프론트 전송값)
        Long startMs = getLong(payload, "start");
        if (startMs == null) {
            return ResponseEntity.badRequest().body("start(epoch ms)는 필수입니다.");
        }
        Long endMs = getLong(payload, "end");

        GroupScheduleCreateDto dto = new GroupScheduleCreateDto();
        dto.setGroupId(groupId);
        dto.setTitle(title);
        dto.setContent(getString(payload, "content"));
        dto.setLocationName(getString(payload, "location_name"));
        dto.setLatitude(getBigDecimal(payload, "latitude"));
        dto.setLongitude(getBigDecimal(payload, "longitude"));
        dto.setStartAt(epochToLocalDateTime(startMs));
        dto.setEndAt(endMs != null ? epochToLocalDateTime(endMs) : null);
        dto.setMaxAttendance(getInt(payload, "max_attendance", 0));
        dto.setCreatedBy(operator);

        GroupScheduleVo created = groupScheduleService.createSchedule(dto);
        return ResponseEntity.ok(toCalendarEvent(created));
    }

    @PatchMapping("/{groupId}/schedules/{scheduleId}")
    public ResponseEntity<?> editSchedule(
            @PathVariable("groupId")    Long groupId,
            @PathVariable("scheduleId") Long scheduleId,
            @RequestBody Map<String,Object> payload,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        Long operator = userDetails != null ? userDetails.getUserKey() : null;
        if (operator == null) return ResponseEntity.status(401).build();

        GroupScheduleEditDto dto = new GroupScheduleEditDto();
        dto.setChangeReason(getString(payload, "changeReason"));
        dto.setTitle(getString(payload, "title"));
        dto.setContent(getString(payload, "content"));
        dto.setLocationName(getString(payload, "location_name"));
        dto.setLatitude(getBigDecimal(payload, "latitude"));
        dto.setLongitude(getBigDecimal(payload, "longitude"));
        Long startMs = getLong(payload, "start");
        Long endMs   = getLong(payload, "end");
        if (startMs != null) dto.setStartAt(epochToLocalDateTime(startMs));
        if (endMs   != null) dto.setEndAt(epochToLocalDateTime(endMs));
        dto.setMaxAttendance(getInt(payload, "max_attendance", 0));

        try {
            GroupScheduleVo result = groupScheduleService.editSchedule(groupId, scheduleId, dto, operator);
            return ResponseEntity.ok(toCalendarEvent(result));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PatchMapping("/{groupId}/schedules/{scheduleId}/approve")
    public ResponseEntity<?> approveSchedule(
            @PathVariable("groupId") Long groupId,
            @PathVariable("scheduleId") Long scheduleId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        Long operator = userDetails != null ? userDetails.getUserKey() : null;
        if (operator == null) return ResponseEntity.status(401).build();
        GroupScheduleVo result = groupScheduleService.approveSchedule(groupId, scheduleId, operator);
        return ResponseEntity.ok(toCalendarEvent(result));
    }

    @PatchMapping("/{groupId}/schedules/{scheduleId}/reject")
    public ResponseEntity<?> rejectSchedule(
            @PathVariable("groupId") Long groupId,
            @PathVariable("scheduleId") Long scheduleId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        Long operator = userDetails != null ? userDetails.getUserKey() : null;
        if (operator == null) return ResponseEntity.status(401).build();
        GroupScheduleVo result = groupScheduleService.rejectSchedule(groupId, scheduleId, operator);
        return ResponseEntity.ok(toCalendarEvent(result));
    }

    @PatchMapping("/{groupId}/schedules/{scheduleId}/cancel")
    public ResponseEntity<?> cancelSchedule(
            @PathVariable("groupId") Long groupId,
            @PathVariable("scheduleId") Long scheduleId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        Long operator = userDetails != null ? userDetails.getUserKey() : null;
        if (operator == null) return ResponseEntity.status(401).build();
        GroupScheduleVo result = groupScheduleService.cancelSchedule(groupId, scheduleId, operator);
        return ResponseEntity.ok(toCalendarEvent(result));
    }

    // ── Shared helpers ────────────────────────────────────────────────────────

    private Map<String,Object> toCalendarEvent(GroupScheduleVo s) {
        Map<String,Object> ev = new HashMap<>();
        ev.put("id",            s.getScheduleId());
        ev.put("title",         s.getTitle());
        ev.put("description",   s.getContent());
        ev.put("locationName",  s.getLocationName());
        ev.put("status",        s.getStatus().name());
        ev.put("maxAttendance", s.getMaxAttendance());
        ev.put("createdBy",     s.getCreatedBy());
        ev.put("isCompleted",   s.isCompleted());
        if (s.getStatus() == GroupScheduleVo.ScheduleStatus.CONFIRMED) {
            ev.put("confirmedCount", scheduleAttendanceMapper.countConfirmedAttendees(s.getScheduleId()));
        }
        ev.put("startAt", s.getStartAt().toString());
        ev.put("endAt",   s.getEndAt() != null ? s.getEndAt().toString() : null);
        ev.put("start",   toEpochMs(s.getStartAt()));
        ev.put("end",     toEpochMs(s.getEndAt()));
        return ev;
    }

    private Long toEpochMs(LocalDateTime ldt) {
        return ldt == null ? null :
                ldt.atZone(ZoneId.systemDefault()).toInstant().toEpochMilli();
    }

    private LocalDateTime epochToLocalDateTime(Long epochMs) {
        return epochMs == null ? null :
                Instant.ofEpochMilli(epochMs).atZone(ZoneId.systemDefault()).toLocalDateTime();
    }

    private String getString(Map<String,Object> m, String key) {
        Object v = m.get(key);
        if (v == null) return null;
        String s = v.toString().trim();
        return s.isEmpty() ? null : s;
    }

    private Long getLong(Map<String,Object> m, String key) {
        Object v = m.get(key);
        if (v == null) return null;
        try {
            return v instanceof Number ? ((Number) v).longValue() : Long.parseLong(v.toString());
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private int getInt(Map<String,Object> m, String key, int defaultVal) {
        Object v = m.get(key);
        if (v == null) return defaultVal;
        try {
            return v instanceof Number ? ((Number) v).intValue() : Integer.parseInt(v.toString());
        } catch (NumberFormatException e) {
            return defaultVal;
        }
    }

    private BigDecimal getBigDecimal(Map<String,Object> m, String key) {
        Object v = m.get(key);
        if (v == null) return null;
        try {
            return new BigDecimal(v.toString());
        } catch (NumberFormatException e) {
            return null;
        }
    }
}

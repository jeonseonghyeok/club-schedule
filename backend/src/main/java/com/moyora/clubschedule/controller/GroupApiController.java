package com.moyora.clubschedule.controller;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.moyora.clubschedule.exception.ApiErrors;
import com.moyora.clubschedule.dto.GroupScheduleCreateDto;
import com.moyora.clubschedule.dto.GroupScheduleEditDto;
import com.moyora.clubschedule.mapper.ScheduleAttendanceMapper;
import com.moyora.clubschedule.security.CustomUserDetails;
import com.moyora.clubschedule.service.GroupManageService;
import com.moyora.clubschedule.service.GroupPermissionService;
import com.moyora.clubschedule.service.GroupScheduleService;
import com.moyora.clubschedule.service.GroupService;
import com.moyora.clubschedule.service.ScheduleAttendanceService;
import com.moyora.clubschedule.vo.GroupMemberVo;
import com.moyora.clubschedule.vo.GroupRole;
import com.moyora.clubschedule.vo.GroupScheduleVo;
import com.moyora.clubschedule.vo.ScheduleAttendanceVo;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/groups")
@RequiredArgsConstructor
public class GroupApiController {

    private final GroupService groupService;
    private final GroupManageService groupManageService;
    private final GroupPermissionService groupPermissionService;
    private final GroupScheduleService groupScheduleService;
    private final ScheduleAttendanceService scheduleAttendanceService;
    private final ScheduleAttendanceMapper scheduleAttendanceMapper;

    private static final String MEMBERS_ONLY_MESSAGE = "모임 회원만 볼 수 있습니다.";

    // ── Members ──────────────────────────────────────────────────────────────

    @GetMapping("/{groupId}/members")
    public ResponseEntity<?> members(
            @PathVariable Long groupId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        Long viewer = userDetails != null ? userDetails.getUserKey() : null;
        if (viewer == null) return ApiErrors.unauthorized();
        // 탈퇴·추방 이력과 차단 사유까지 담겨 있어 모임 회원에게만 보여준다
        if (!groupManageService.isMember(groupId, viewer)) return ApiErrors.forbidden(MEMBERS_ONLY_MESSAGE);
        List<GroupMemberVo> members = groupManageService.listMembers(groupId);
        List<Map<String,Object>> out = new ArrayList<>();
        for (GroupMemberVo m : members) {
            Map<String,Object> map = new HashMap<>();
            map.put("userKey",     m.getUserKey());
            map.put("displayName", m.getDisplayName());
            map.put("role",        m.getRole());
            map.put("status",      m.getStatus());
            map.put("joinedAt",    m.getJoinedAt() != null ? m.getJoinedAt().toString() : null);
            map.put("leftAt",      m.getLeftAt() != null ? m.getLeftAt().toString() : null);
            map.put("banned",     Boolean.TRUE.equals(m.getBanned()));
            map.put("banReason",  m.getBanReason());
            if ("MANAGER".equals(m.getRole()) && "ACTIVE".equals(m.getStatus())) {
                List<String> presets = new ArrayList<>();
                for (GroupPermissionService.PermissionPreset p : groupPermissionService.resolveActivePresets(groupId, m.getUserKey())) {
                    presets.add(p.name());
                }
                map.put("presets", presets);
            }
            out.add(map);
        }
        return ResponseEntity.ok(out);
    }

    @PatchMapping("/{groupId}/members/{userKey}/role")
    public ResponseEntity<?> changeMemberRole(
            @PathVariable Long groupId,
            @PathVariable Long userKey,
            @RequestBody Map<String, Object> payload,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        Long operator = userDetails != null ? userDetails.getUserKey() : null;
        if (operator == null) return ApiErrors.unauthorized();

        String roleStr = getString(payload, "role");
        GroupRole newRole;
        try {
            newRole = GroupRole.valueOf((roleStr == null ? "" : roleStr).toUpperCase());
        } catch (IllegalArgumentException e) {
            return ApiErrors.badRequest("role은 LEADER/MANAGER/MEMBER 중 하나여야 합니다.");
        }

        boolean ok = groupManageService.changeRole(groupId, userKey, newRole, operator);
        return ok ? ResponseEntity.ok().build()
                : ApiErrors.forbidden("리더만 활동 중인 회원의 역할을 바꿀 수 있습니다.");
    }

    @PutMapping("/{groupId}/members/{userKey}/permissions")
    public ResponseEntity<?> setMemberPermissions(
            @PathVariable Long groupId,
            @PathVariable Long userKey,
            @RequestBody(required = false) Map<String, Object> payload,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        Long operator = userDetails != null ? userDetails.getUserKey() : null;
        if (operator == null) return ApiErrors.unauthorized();

        java.util.Set<GroupPermissionService.PermissionPreset> presets =
                java.util.EnumSet.noneOf(GroupPermissionService.PermissionPreset.class);
        Object presetsObj = payload != null ? payload.get("presets") : null;
        if (presetsObj instanceof List) {
            for (Object o : (List<?>) presetsObj) {
                try {
                    presets.add(GroupPermissionService.PermissionPreset.valueOf(o.toString().toUpperCase()));
                } catch (IllegalArgumentException ignored) { /* 알 수 없는 프리셋은 무시 */ }
            }
        }

        boolean ok = groupPermissionService.applyPermissionPresets(groupId, userKey, presets, operator);
        return ok ? ResponseEntity.ok().build()
                : ApiErrors.forbidden("리더만 매니저에게 권한을 줄 수 있습니다.");
    }

    @PatchMapping("/{groupId}/members/{userKey}/ban")
    public ResponseEntity<?> banMember(
            @PathVariable Long groupId,
            @PathVariable Long userKey,
            @RequestBody(required = false) Map<String, Object> payload,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        Long operator = userDetails != null ? userDetails.getUserKey() : null;
        if (operator == null) return ApiErrors.unauthorized();
        Object reasonObj = payload != null ? payload.get("reason") : null;
        String reason = reasonObj != null ? reasonObj.toString() : null;
        boolean ok = groupManageService.banMember(groupId, userKey, operator, reason);
        return ok ? ResponseEntity.ok().build()
                : ApiErrors.forbidden("매니저 이상만 일반회원을 내보내거나 차단할 수 있습니다.");
    }

    @DeleteMapping("/{groupId}/members/{userKey}/ban")
    public ResponseEntity<?> unbanMember(
            @PathVariable Long groupId,
            @PathVariable Long userKey,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        Long operator = userDetails != null ? userDetails.getUserKey() : null;
        if (operator == null) return ApiErrors.unauthorized();
        boolean ok = groupManageService.unbanMember(groupId, userKey, operator);
        return ok ? ResponseEntity.ok().build() : ApiErrors.forbidden("매니저 이상만 차단을 해제할 수 있습니다.");
    }

    // 본인의 그룹 내 참가 이력(일정별 최신 상태, 최신 일정순) — 마이페이지성 화면 부재 findings 반영
    @GetMapping("/{groupId}/attendance/me")
    public ResponseEntity<?> myAttendanceHistory(
            @PathVariable Long groupId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        Long userKey = userDetails != null ? userDetails.getUserKey() : null;
        if (userKey == null) return ApiErrors.unauthorized();

        List<ScheduleAttendanceVo> list = scheduleAttendanceService.listMyHistory(groupId, userKey);
        List<Map<String, Object>> result = new ArrayList<>();
        for (ScheduleAttendanceVo v : list) {
            Map<String, Object> m = new HashMap<>();
            m.put("scheduleId",    v.getScheduleId());
            m.put("scheduleTitle", v.getScheduleTitle());
            m.put("scheduleStartAt", v.getScheduleStartAt() != null ? v.getScheduleStartAt().toString() : null);
            m.put("status",        v.getStatus() != null ? v.getStatus().name() : null);
            m.put("actualStatus",  v.getActualStatus() != null ? v.getActualStatus().name() : null);
            result.add(m);
        }
        return ResponseEntity.ok(result);
    }

    // 참가인원 호버 팝오버 프리페치 — 여러 scheduleId의 명단을 한 번에 반환
    @GetMapping("/{groupId}/attendance/roster")
    public ResponseEntity<?> getRosterBulk(
            @PathVariable Long groupId,
            @RequestParam List<Long> scheduleIds,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        if (userDetails == null) return ApiErrors.unauthorized();
        if (!groupManageService.isMember(groupId, userDetails.getUserKey())) {
            return ApiErrors.forbidden(MEMBERS_ONLY_MESSAGE);
        }

        Map<Long, List<ScheduleAttendanceVo>> byId =
                scheduleAttendanceService.listActiveRosterByScheduleIds(groupId, scheduleIds);

        Map<String, Object> result = new HashMap<>();
        for (Map.Entry<Long, List<ScheduleAttendanceVo>> e : byId.entrySet()) {
            List<Map<String,Object>> rows = new ArrayList<>();
            for (ScheduleAttendanceVo v : e.getValue()) {
                Map<String,Object> row = new HashMap<>();
                row.put("displayName", v.getDisplayName());
                row.put("status", v.getStatus().name());
                rows.add(row);
            }
            result.put(String.valueOf(e.getKey()), rows);
        }
        return ResponseEntity.ok(result);
    }

    // ── Schedules ─────────────────────────────────────────────────────────────

    @GetMapping("/{groupId}/schedules")
    public ResponseEntity<?> getSchedules(
            @PathVariable Long groupId,
            @RequestParam(required = false) Long from,
            @RequestParam(required = false) Long to,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        Long userKey = userDetails != null ? userDetails.getUserKey() : null;
        List<GroupScheduleVo> schedules = groupScheduleService.listSchedules(
                groupId, userKey, epochToLocalDateTime(from), epochToLocalDateTime(to));

        List<Long> confirmedIds = schedules.stream()
                .filter(s -> s.getStatus() == GroupScheduleVo.ScheduleStatus.CONFIRMED)
                .map(GroupScheduleVo::getScheduleId)
                .collect(Collectors.toList());

        Map<Long, Integer> confirmedCountByScheduleId = Map.of();
        Map<Long, String>  myStatusByScheduleId       = Map.of();
        if (!confirmedIds.isEmpty()) {
            confirmedCountByScheduleId = scheduleAttendanceMapper.countConfirmedByScheduleIds(confirmedIds).stream()
                    .collect(Collectors.toMap(
                            row -> ((Number) row.get("scheduleId")).longValue(),
                            row -> ((Number) row.get("cnt")).intValue()));
            if (userKey != null) {
                myStatusByScheduleId = scheduleAttendanceMapper.selectMyLatestByScheduleIds(confirmedIds, userKey).stream()
                        .collect(Collectors.toMap(ScheduleAttendanceVo::getScheduleId, v -> v.getStatus().name()));
            }
        }

        List<Map<String,Object>> result = new ArrayList<>();
        for (GroupScheduleVo s : schedules) {
            result.add(toCalendarEvent(s, myStatusByScheduleId, confirmedCountByScheduleId));
        }
        return ResponseEntity.ok(result);
    }

    @PostMapping("/{groupId}/schedules")
    public ResponseEntity<?> createSchedule(
            @PathVariable Long groupId,
            @RequestBody Map<String,Object> payload,
            @AuthenticationPrincipal CustomUserDetails userDetails) {

        Long operator = userDetails != null ? userDetails.getUserKey() : null;
        if (operator == null) return ApiErrors.unauthorized();

        if (!groupManageService.isMember(groupId, operator)) {
            return ApiErrors.forbidden("모임 회원만 일정을 등록할 수 있습니다.");
        }

        String title = getString(payload, "title");
        if (title == null || title.isBlank()) {
            return ApiErrors.badRequest("일정 제목을 입력하세요.");
        }

        // start: epoch ms (프론트 전송값)
        Long startMs = getLong(payload, "start");
        if (startMs == null) {
            return ApiErrors.badRequest("시작 시간을 입력하세요.");
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
        return ResponseEntity.ok(toCalendarEvent(created, operator));
    }

    @PatchMapping("/{groupId}/schedules/{scheduleId}")
    public ResponseEntity<?> editSchedule(
            @PathVariable Long groupId,
            @PathVariable Long scheduleId,
            @RequestBody Map<String,Object> payload,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        Long operator = userDetails != null ? userDetails.getUserKey() : null;
        if (operator == null) return ApiErrors.unauthorized();

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
            return ResponseEntity.ok(toCalendarEvent(result, operator));
        } catch (IllegalArgumentException e) {
            return ApiErrors.badRequest(e.getMessage());
        }
    }

    @PatchMapping("/{groupId}/schedules/{scheduleId}/approve")
    public ResponseEntity<?> approveSchedule(
            @PathVariable Long groupId,
            @PathVariable Long scheduleId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        Long operator = userDetails != null ? userDetails.getUserKey() : null;
        if (operator == null) return ApiErrors.unauthorized();
        GroupScheduleVo result = groupScheduleService.approveSchedule(groupId, scheduleId, operator);
        return ResponseEntity.ok(toCalendarEvent(result, operator));
    }

    @PatchMapping("/{groupId}/schedules/{scheduleId}/reject")
    public ResponseEntity<?> rejectSchedule(
            @PathVariable Long groupId,
            @PathVariable Long scheduleId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        Long operator = userDetails != null ? userDetails.getUserKey() : null;
        if (operator == null) return ApiErrors.unauthorized();
        GroupScheduleVo result = groupScheduleService.rejectSchedule(groupId, scheduleId, operator);
        return ResponseEntity.ok(toCalendarEvent(result, operator));
    }

    @PatchMapping("/{groupId}/schedules/{scheduleId}/cancel")
    public ResponseEntity<?> cancelSchedule(
            @PathVariable Long groupId,
            @PathVariable Long scheduleId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        Long operator = userDetails != null ? userDetails.getUserKey() : null;
        if (operator == null) return ApiErrors.unauthorized();
        GroupScheduleVo result = groupScheduleService.cancelSchedule(groupId, scheduleId, operator);
        return ResponseEntity.ok(toCalendarEvent(result, operator));
    }

    // ── Shared helpers ────────────────────────────────────────────────────────

    /** 단건 액션(생성/수정/승인/거부/취소) 응답용 — 대상이 1건뿐이라 단건 조회로도 N+1이 아니다. */
    private Map<String,Object> toCalendarEvent(GroupScheduleVo s, Long viewerUserKey) {
        Map<String,Object> ev = baseCalendarEvent(s);
        if (s.getStatus() == GroupScheduleVo.ScheduleStatus.CONFIRMED) {
            ev.put("confirmedCount", scheduleAttendanceMapper.countConfirmedAttendees(s.getScheduleId()));
            if (viewerUserKey != null) {
                ScheduleAttendanceVo mine = scheduleAttendanceMapper.selectLatest(s.getScheduleId(), viewerUserKey);
                ev.put("myAttendanceStatus", mine != null ? mine.getStatus().name() : null);
            }
        }
        return ev;
    }

    /** 목록 조회 응답용 — 참가인원/내 참가여부를 스케줄 개수만큼 반복 조회하지 않도록 미리 벌크 조회한 맵을 사용한다. */
    private Map<String,Object> toCalendarEvent(
            GroupScheduleVo s,
            Map<Long,String> myStatusByScheduleId,
            Map<Long,Integer> confirmedCountByScheduleId) {
        Map<String,Object> ev = baseCalendarEvent(s);
        if (s.getStatus() == GroupScheduleVo.ScheduleStatus.CONFIRMED) {
            ev.put("confirmedCount", confirmedCountByScheduleId.getOrDefault(s.getScheduleId(), 0));
            ev.put("myAttendanceStatus", myStatusByScheduleId.get(s.getScheduleId()));
        }
        return ev;
    }

    private Map<String,Object> baseCalendarEvent(GroupScheduleVo s) {
        Map<String,Object> ev = new HashMap<>();
        ev.put("id",            s.getScheduleId());
        ev.put("title",         s.getTitle());
        ev.put("description",   s.getContent());
        ev.put("locationName",  s.getLocationName());
        ev.put("status",        s.getStatus().name());
        ev.put("maxAttendance", s.getMaxAttendance());
        ev.put("createdBy",     s.getCreatedBy());
        ev.put("isCompleted",   s.isCompleted());
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

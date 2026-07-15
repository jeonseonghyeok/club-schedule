package com.moyora.clubschedule.controller;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.moyora.clubschedule.security.CustomUserDetails;
import com.moyora.clubschedule.service.ScheduleAttendanceService;
import com.moyora.clubschedule.vo.ScheduleAttendanceVo;
import com.moyora.clubschedule.vo.ScheduleAttendanceVo.ActualStatus;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/groups/{groupId}/schedules/{scheduleId}")
@RequiredArgsConstructor
public class ScheduleAttendanceApiController {

    private final ScheduleAttendanceService attendanceService;

    /** 참석 신청 */
    @PostMapping("/attend")
    public ResponseEntity<?> attend(
            @PathVariable Long groupId,
            @PathVariable Long scheduleId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        Long userKey = userKey(userDetails);
        if (userKey == null) return ResponseEntity.status(401).build();
        ScheduleAttendanceVo result = attendanceService.attend(groupId, scheduleId, userKey);
        return ResponseEntity.ok(toMap(result));
    }

    /** 참석 취소 (본인) */
    @DeleteMapping("/attend")
    public ResponseEntity<?> cancelAttend(
            @PathVariable Long groupId,
            @PathVariable Long scheduleId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        Long userKey = userKey(userDetails);
        if (userKey == null) return ResponseEntity.status(401).build();
        attendanceService.cancelAttend(groupId, scheduleId, userKey);
        return ResponseEntity.ok().build();
    }

    /** 참석자 목록 */
    @GetMapping("/attendance")
    public ResponseEntity<?> listAttendees(
            @PathVariable Long groupId,
            @PathVariable Long scheduleId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        if (userKey(userDetails) == null) return ResponseEntity.status(401).build();
        List<ScheduleAttendanceVo> list = attendanceService.listAttendees(groupId, scheduleId);
        List<Map<String, Object>> result = new ArrayList<>();
        for (ScheduleAttendanceVo v : list) result.add(toMap(v));
        return ResponseEntity.ok(result);
    }

    /** 참석 이력(신청/승인/거부/취소) — is_latest 무관 전체, 시간순 */
    @GetMapping("/attendance/history")
    public ResponseEntity<?> listHistory(
            @PathVariable Long groupId,
            @PathVariable Long scheduleId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        if (userKey(userDetails) == null) return ResponseEntity.status(401).build();
        List<ScheduleAttendanceVo> list = attendanceService.listHistory(groupId, scheduleId);
        List<Map<String, Object>> result = new ArrayList<>();
        for (ScheduleAttendanceVo v : list) result.add(toHistoryMap(v));
        return ResponseEntity.ok(result);
    }

    /** 참석 승인 */
    @PatchMapping("/attendance/{targetUserKey}/approve")
    public ResponseEntity<?> approve(
            @PathVariable Long groupId,
            @PathVariable Long scheduleId,
            @PathVariable Long targetUserKey,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        Long userKey = userKey(userDetails);
        if (userKey == null) return ResponseEntity.status(401).build();
        ScheduleAttendanceVo result = attendanceService.approveAttendance(groupId, scheduleId, targetUserKey, userKey);
        return ResponseEntity.ok(toMap(result));
    }

    /** 참석 거부 */
    @PatchMapping("/attendance/{targetUserKey}/reject")
    public ResponseEntity<?> reject(
            @PathVariable Long groupId,
            @PathVariable Long scheduleId,
            @PathVariable Long targetUserKey,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        Long userKey = userKey(userDetails);
        if (userKey == null) return ResponseEntity.status(401).build();
        attendanceService.rejectAttendance(groupId, scheduleId, targetUserKey, userKey);
        return ResponseEntity.ok().build();
    }

    /** 강제 취소 (관리자) */
    @DeleteMapping("/attendance/{targetUserKey}")
    public ResponseEntity<?> forceCancel(
            @PathVariable Long groupId,
            @PathVariable Long scheduleId,
            @PathVariable Long targetUserKey,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        Long userKey = userKey(userDetails);
        if (userKey == null) return ResponseEntity.status(401).build();
        attendanceService.forceCancel(groupId, scheduleId, targetUserKey, userKey);
        return ResponseEntity.ok().build();
    }

    /** 출석 체크 */
    @PatchMapping("/attendance/{targetUserKey}/check")
    public ResponseEntity<?> check(
            @PathVariable Long groupId,
            @PathVariable Long scheduleId,
            @PathVariable Long targetUserKey,
            @RequestBody Map<String, Object> payload,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        Long userKey = userKey(userDetails);
        if (userKey == null) return ResponseEntity.status(401).build();

        String actualStr = payload.getOrDefault("actualStatus", "ATTENDED").toString();
        ActualStatus actual;
        try { actual = ActualStatus.valueOf(actualStr.toUpperCase()); }
        catch (IllegalArgumentException e) { actual = ActualStatus.ATTENDED; }

        Object reasonObj = payload.get("changeReason");
        String changeReason = reasonObj != null ? reasonObj.toString() : null;

        ScheduleAttendanceVo result = attendanceService.checkActual(
                groupId, scheduleId, targetUserKey, actual, userKey, changeReason);
        return ResponseEntity.ok(toMap(result));
    }

    // ── helpers ───────────────────────────────────────────────────────────────

    private Long userKey(CustomUserDetails u) {
        return u != null ? u.getUserKey() : null;
    }

    private Map<String, Object> toMap(ScheduleAttendanceVo v) {
        Map<String, Object> m = new HashMap<>();
        m.put("attendanceId",       v.getAttendanceId());
        m.put("scheduleId",         v.getScheduleId());
        m.put("userKey",            v.getUserKey());
        m.put("displayName",        v.getDisplayName());
        m.put("status",             v.getStatus() != null ? v.getStatus().name() : null);
        m.put("actualStatus",       v.getActualStatus() != null ? v.getActualStatus().name() : null);
        m.put("processedByUserKey", v.getProcessedByUserKey());
        m.put("createdAt",          v.getCreatedAt() != null ? v.getCreatedAt().toString() : null);
        m.put("checkedAt",          v.getCheckedAt() != null ? v.getCheckedAt().toString() : null);
        m.put("checkedByUserKey",   v.getCheckedByUserKey());
        return m;
    }

    /** 이력 조회 전용 — 대상자/작업자 표시 이름과 본인 여부 플래그 포함 */
    private Map<String, Object> toHistoryMap(ScheduleAttendanceVo v) {
        Map<String, Object> m = new HashMap<>();
        m.put("attendanceId",      v.getAttendanceId());
        m.put("userKey",           v.getUserKey());
        m.put("displayName",       v.getDisplayName());
        m.put("status",            v.getStatus() != null ? v.getStatus().name() : null);
        m.put("actorUserKey",      v.getUpdatedBy());
        m.put("actorDisplayName",  v.getActorDisplayName());
        m.put("selfActed",         v.getUpdatedBy() != null && v.getUpdatedBy().equals(v.getUserKey()));
        m.put("createdAt",         v.getCreatedAt() != null ? v.getCreatedAt().toString() : null);
        return m;
    }
}

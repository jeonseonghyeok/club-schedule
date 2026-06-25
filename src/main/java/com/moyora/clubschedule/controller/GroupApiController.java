package com.moyora.clubschedule.controller;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.moyora.clubschedule.security.CustomUserDetails;
import com.moyora.clubschedule.service.GroupManageService;
import com.moyora.clubschedule.service.GroupScheduleService;
import com.moyora.clubschedule.service.GroupService;
import com.moyora.clubschedule.vo.GroupMemberVo;
import com.moyora.clubschedule.vo.GroupScheduleVo;
import com.moyora.clubschedule.vo.GroupVo;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/groups")
@RequiredArgsConstructor
public class GroupApiController {

    private final GroupService groupService;
    private final GroupManageService groupManageService;
    private final GroupScheduleService groupScheduleService;

    // Simple in-memory schedule store for demo purposes (groupId -> list of events)
    private static final ConcurrentHashMap<Long, List<Map<String,Object>>> SCHEDULE_STORE = new ConcurrentHashMap<>();
    private static final AtomicLong SCHEDULE_ID = new AtomicLong(1000);

    @GetMapping("/{groupId}/members")
    public ResponseEntity<?> members(@PathVariable("groupId") Long groupId) {
        List<GroupMemberVo> members = groupManageService.listMembers(groupId);
        List<Map<String,Object>> out = new ArrayList<>();
        for (GroupMemberVo m : members) {
            Map<String,Object> map = new HashMap<>();
            map.put("userKey", m.getUserKey());
            map.put("displayName", null); // 나중에 UserService로 조회
            map.put("role", m.getRole());
            map.put("status", m.getStatus());
            map.put("joinedAt", m.getJoinedAt() != null ? m.getJoinedAt().toString() : null);
            out.add(map);
        }
        return ResponseEntity.ok(out);
    }

    @PatchMapping("/{groupId}/members/{userKey}/ban")
    public ResponseEntity<?> banMember(@PathVariable("groupId") Long groupId, @PathVariable("userKey") Long userKey, @AuthenticationPrincipal CustomUserDetails userDetails) {
        Long operator = (userDetails != null) ? userDetails.getUserKey() : null;
        if (operator == null) return ResponseEntity.status(401).build();
        boolean ok = groupManageService.banMember(groupId, userKey, operator);
        if (ok) return ResponseEntity.ok().build();
        return ResponseEntity.status(403).build();
    }

    @GetMapping("/{groupId}/schedules")
    public ResponseEntity<?> schedules(@PathVariable("groupId") Long groupId) {
        List<GroupScheduleVo> schedules = groupScheduleService.listSchedules(groupId);
        List<Map<String,Object>> result = new ArrayList<>();
        for (GroupScheduleVo s : schedules) {
            result.add(toCalendarEvent(s));
        }
        return ResponseEntity.ok(result);
    }

    private Map<String,Object> toCalendarEvent(GroupScheduleVo s) {
        Map<String,Object> ev = new HashMap<>();
        ev.put("id",            s.getScheduleId());
        ev.put("title",         s.getTitle());
        ev.put("description",   s.getContent());
        ev.put("locationName",  s.getLocationName());
        ev.put("status",        s.getStatus() != null ? s.getStatus().name() : null);
        ev.put("maxAttendance", s.getMaxAttendance());
        ev.put("createdBy",     s.getCreatedBy());
        ev.put("isCompleted",   s.isCompleted());
        ev.put("startAt", s.getStartAt() != null ? s.getStartAt().toString() : null);
        ev.put("endAt",   s.getEndAt()   != null ? s.getEndAt().toString()   : null);
        ev.put("start", toEpochMs(s.getStartAt()));
        ev.put("end",   toEpochMs(s.getEndAt()));
        return ev;
    }

    private Long toEpochMs(LocalDateTime ldt) {
        return ldt == null ? null :
                ldt.atZone(ZoneId.systemDefault()).toInstant().toEpochMilli();
    }

    @PostMapping("/{groupId}/schedules")
    public ResponseEntity<?> createSchedule(@PathVariable("groupId") Long groupId, @RequestBody Map<String,Object> payload, @AuthenticationPrincipal CustomUserDetails userDetails) {
        // Basic auth check: require authenticated user
        Long operator = (userDetails != null) ? userDetails.getUserKey() : null;
        if (operator == null) return ResponseEntity.status(401).build();

        // payload expected: { title: string, start: epochMillis }
        String title = (payload.get("title") != null) ? String.valueOf(payload.get("title")) : null;
        Object startObj = payload.get("start");
        Long start = null;
        try {
            if (startObj instanceof Number) start = ((Number)startObj).longValue();
            else if (startObj instanceof String) start = Long.parseLong((String)startObj);
        } catch (Exception ex) { start = null; }

        if (title == null || title.trim().isEmpty() || start == null) {
            return ResponseEntity.badRequest().body("title and start are required");
        }

        Map<String,Object> event = new HashMap<>();
        long id = SCHEDULE_ID.getAndIncrement();
        event.put("id", id);
        event.put("title", title);
        event.put("start", start);
        event.put("createdBy", operator);

        SCHEDULE_STORE.compute(groupId, (k, list) -> {
            if (list == null) list = new ArrayList<>();
            list.add(event);
            return list;
        });

        return ResponseEntity.ok(event);
    }
}
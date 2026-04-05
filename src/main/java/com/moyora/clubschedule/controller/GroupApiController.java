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
import org.springframework.web.bind.annotation.RestController;

import com.moyora.clubschedule.security.CustomUserDetails;
import com.moyora.clubschedule.service.GroupManageService;
import com.moyora.clubschedule.service.GroupService;
import com.moyora.clubschedule.vo.GroupMemberVo;
import com.moyora.clubschedule.vo.GroupVo;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/groups")
@RequiredArgsConstructor
public class GroupApiController {

    private final GroupService groupService;
    private final GroupManageService groupManageService;

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
        // 현재는 플레이스홀더: 추후 ScheduleService를 통해 실제 일정을 반환
        List<Map<String, Object>> ev = new ArrayList<>();
        Map<String,Object> e = new HashMap<>(); e.put("id", 101); e.put("title", "정기 모임"); e.put("start", System.currentTimeMillis()+86400000L);
        ev.add(e);
        return ResponseEntity.ok(ev);
    }
}
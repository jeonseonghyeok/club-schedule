package com.moyora.clubschedule.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import com.moyora.clubschedule.security.CustomUserDetails;
import com.moyora.clubschedule.service.GroupJoinRequestService;
import com.moyora.clubschedule.vo.GroupJoinRequestVo;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/groups/joins")
public class AdminGroupJoinController {

    @Autowired
    private GroupJoinRequestService service;

    @GetMapping("/pending/{groupId}")
    public ResponseEntity<?> pendingForGroup(@PathVariable Long groupId) {
        List<GroupJoinRequestVo> list = service.getPendingByGroup(groupId);
        return ResponseEntity.ok(list);
    }

    @PatchMapping("/{requestId}/approve")
    public ResponseEntity<?> approve(@PathVariable Long requestId, @AuthenticationPrincipal CustomUserDetails userDetails) {
        Long operatorKey = userDetails.getUserKey();
        // authorization: only group leader for the request can approve
        if (!service.isLeaderForRequest(requestId, operatorKey)) {
            return ResponseEntity.status(403).body(Map.of("error", "권한이 없습니다."));
        }
        try {
            boolean ok = service.approveJoin(requestId, operatorKey);
            return ResponseEntity.ok(Map.of("ok", true));
        } catch (RuntimeException ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        }
    }

    @PatchMapping("/{requestId}/reject")
    public ResponseEntity<?> reject(@PathVariable Long requestId, @RequestBody java.util.Map<String,String> body, @AuthenticationPrincipal CustomUserDetails userDetails) {
        Long operatorKey = userDetails.getUserKey();
        // authorization: only group leader for the request can reject
        if (!service.isLeaderForRequest(requestId, operatorKey)) {
            return ResponseEntity.status(403).body(Map.of("error", "권한이 없습니다."));
        }
        String reason = body.get("rejectReason");
        try {
            boolean ok = service.rejectJoin(requestId, operatorKey, reason);
            return ResponseEntity.ok(Map.of("ok", true));
        } catch (RuntimeException ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        }
    }
}
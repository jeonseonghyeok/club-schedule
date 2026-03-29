package com.moyora.clubschedule.controller.group;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import com.moyora.clubschedule.security.CustomUserDetails;
import com.moyora.clubschedule.service.GroupJoinRequestService;

import java.util.Map;

@RestController
@RequestMapping("/groups/joins")
public class GroupJoinApprovalController {

    @Autowired
    private GroupJoinRequestService service;

    @GetMapping("/pending/{groupId}")
    public ResponseEntity<?> pendingForGroup(@PathVariable Long groupId) {
        return ResponseEntity.ok(service.getPendingByGroup(groupId));
    }

    @PreAuthorize("@groupJoinRequestService.isLeaderForRequest(#requestId, principal.userKey)")
    @PatchMapping("/{requestId}/approve")
    public ResponseEntity<?> approve(@PathVariable Long requestId, @AuthenticationPrincipal CustomUserDetails userDetails) {
        Long operatorKey = userDetails.getUserKey();
        try {
            boolean ok = service.approveJoin(requestId, operatorKey);
            return ResponseEntity.ok(Map.of("ok", ok));
        } catch (RuntimeException ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        }
    }

    @PreAuthorize("@groupJoinRequestService.isLeaderForRequest(#requestId, principal.userKey)")
    @PatchMapping("/{requestId}/reject")
    public ResponseEntity<?> reject(@PathVariable Long requestId, @RequestBody java.util.Map<String,String> body, @AuthenticationPrincipal CustomUserDetails userDetails) {
        Long operatorKey = userDetails.getUserKey();
        String reason = body.get("rejectReason");
        try {
            boolean ok = service.rejectJoin(requestId, operatorKey, reason);
            return ResponseEntity.ok(Map.of("ok", ok));
        } catch (RuntimeException ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        }
    }
}
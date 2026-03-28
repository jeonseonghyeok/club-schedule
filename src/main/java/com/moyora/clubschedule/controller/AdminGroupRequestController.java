package com.moyora.clubschedule.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import com.moyora.clubschedule.security.CustomUserDetails;
import com.moyora.clubschedule.service.GroupRequestService;
import com.moyora.clubschedule.vo.GroupRequestRejectDto;

import java.util.Map;

@RestController
@RequestMapping("/admin/group-requests")
public class AdminGroupRequestController {

    @Autowired
    private GroupRequestService groupRequestService;

    // 관리자 권한 필요
    @PreAuthorize("hasRole('ADMIN')")
    @PatchMapping("/{requestId}/approve")
    public ResponseEntity<?> approveRequest(
            @PathVariable Long requestId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {

        Long userKey = userDetails.getUserKey();
        try {
            groupRequestService.approveRequest(requestId, userKey);
            return ResponseEntity.ok(Map.of("ok", true));
        } catch (RuntimeException ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        }
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PatchMapping("/{requestId}/reject")
    public ResponseEntity<?> rejectRequest(
            @PathVariable Long requestId,
            @RequestBody GroupRequestRejectDto dto,
            @AuthenticationPrincipal CustomUserDetails userDetails) {

        Long userKey = userDetails.getUserKey();
        try {
            boolean result = groupRequestService.rejectGroupRequest(dto.getRequestId(), userKey, dto.getRejectReason());
            if (result) return ResponseEntity.ok(Map.of("ok", true));
            return ResponseEntity.badRequest().body(Map.of("error", "거부 처리에 실패했습니다."));
        } catch (RuntimeException ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        }
    }
}
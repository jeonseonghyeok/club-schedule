package com.moyora.clubschedule.controller;

import java.util.Collections;
import java.util.List;
import java.util.Map;

import jakarta.validation.Valid;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import com.moyora.clubschedule.security.CustomUserDetails;
import com.moyora.clubschedule.service.GroupRequestService;
import com.moyora.clubschedule.vo.GroupRequest;
import com.moyora.clubschedule.vo.GroupRequestDto;

@RestController
@RequestMapping("/group-requests")
public class GroupRequestController {
	 private static final Logger log = LoggerFactory.getLogger(GroupRequestController.class);

	@Autowired
    private GroupRequestService groupRequestService;

	/**
	 * @param userDetails
	 * @param dto
	 * @return
	 */
    @PostMapping
    public ResponseEntity<?> requestGroup(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody GroupRequestDto dto) {
    	
    	// 인증된 사용자로부터 userKey를 가져옴
        Long userKey = userDetails.getUserKey();
        
        // 서비스 메서드 호출 및 결과(requestId) 받기
        Long requestId = groupRequestService.requestGroup(dto, userKey);
        
        if (requestId == null) {
            // 신청 불가 시 409 Conflict 또는 400 Bad Request 반환
            return ResponseEntity.status(409).build(); 
        }
        return ResponseEntity.ok(Collections.singletonMap("requestId", requestId));
    }
    
    //신청 현황 조회
    @GetMapping
    public ResponseEntity<?> requestGroup(@AuthenticationPrincipal CustomUserDetails userDetails) {
    
        // CustomUserDetails 객체에서 Long 타입의 userKey를 직접 가져옴
        Long userKey = userDetails.getUserKey();
        log.info("로그인된 사용자의 userKey: {}", userKey);
        
        List<GroupRequest> groupRequestList = groupRequestService.getMyRequest(userKey);
        
        return ResponseEntity.ok(groupRequestList);
    }
    
    // 사용자에 의한 신청 취소 (상태 변경 명시)
    @PatchMapping("/{requestId}/cancel")
    public ResponseEntity<?> cancelRequest(
    		@PathVariable("requestId") Long requestId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        
        Long userKey = userDetails.getUserKey();
        
        boolean isCancelled = groupRequestService.cancelGroupRequest(requestId, userKey);
        
        if (isCancelled) {
            return ResponseEntity.ok().build(); // 성공 시 200 OK
        } else {
            return ResponseEntity.badRequest().build(); // 실패 시 400 Bad Request (예: 신청 ID를 찾을 수 없거나, 본인 신청이 아님)
        }
    }

    // 관리자 전용: 승인
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    @PostMapping("/{requestId}/approve")
    public ResponseEntity<?> approveRequest(@PathVariable("requestId") Long requestId, @AuthenticationPrincipal CustomUserDetails userDetails) {
        // 안전하게 관리자 키를 가져옴
        Long adminKey = null;
        if (userDetails != null) {
            adminKey = userDetails.getUserKey();
        } else {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null) {
                Object principal = auth.getPrincipal();
                if (principal instanceof CustomUserDetails) {
                    adminKey = ((CustomUserDetails) principal).getUserKey();
                }
            }
        }
        try {
            groupRequestService.approveRequest(requestId, adminKey);
            return ResponseEntity.ok().build();
        } catch (RuntimeException ex) {
            return ResponseEntity.status(409).body(Map.of("error", ex.getMessage()));
        }
    }

    // 관리자 전용: 거부
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    @PostMapping("/{requestId}/reject")
    public ResponseEntity<?> rejectRequest(@PathVariable("requestId") Long requestId, @RequestBody Map<String, String> body, @AuthenticationPrincipal CustomUserDetails userDetails) {
        Long adminKey = null;
        if (userDetails != null) {
            adminKey = userDetails.getUserKey();
        } else {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null) {
                Object principal = auth.getPrincipal();
                if (principal instanceof CustomUserDetails) {
                    adminKey = ((CustomUserDetails) principal).getUserKey();
                }
            }
        }
        String reason = body.get("rejectReason");
        boolean ok = groupRequestService.rejectGroupRequest(requestId, adminKey, reason);
        if (ok) return ResponseEntity.ok().build();
        return ResponseEntity.badRequest().build();
    }
    
}
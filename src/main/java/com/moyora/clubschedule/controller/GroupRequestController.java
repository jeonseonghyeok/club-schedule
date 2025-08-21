package com.moyora.clubschedule.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.moyora.clubschedule.service.GroupRequestService;
import com.moyora.clubschedule.vo.GroupRequestDto;



@RestController
@RequestMapping("/groups/request")
public class GroupRequestController {
	
	@Autowired
    private GroupRequestService groupRequestService;

    // 1. 그룹 신청
    @PostMapping
    public ResponseEntity<?> requestGroup(@RequestBody GroupRequestDto dto) {
        groupRequestService.requestGroup(dto);
        return ResponseEntity.ok().build();
    }
    
    //신청 현황 조회
    @GetMapping
    public ResponseEntity<?> requestGroup() {
        return ResponseEntity.ok().build();
    }
    
    // 2. 신청 취소
    @DeleteMapping("/{groupId}")
    public ResponseEntity<?> cancelRequest(@PathVariable Long groupId) {
//        groupRequestService.cancelRequest(groupId);
        return ResponseEntity.ok().build();
    }

    
}
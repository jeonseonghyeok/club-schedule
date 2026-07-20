package com.moyora.clubschedule.controller;

import java.util.List;

import jakarta.validation.Valid;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import com.moyora.clubschedule.security.CustomUserDetails;
import com.moyora.clubschedule.service.GroupManageService;
import com.moyora.clubschedule.service.GroupService;
import com.moyora.clubschedule.service.UserService;
import com.moyora.clubschedule.vo.GroupVo;
import com.moyora.clubschedule.vo.UserVo;

@RestController
@RequestMapping("/groups")
public class GroupController {

    @Autowired
    private GroupService groupService;
    @Autowired
    private GroupManageService groupManageService;
    @Autowired
    private UserService userService;

    @GetMapping("/me")
    public ResponseEntity<?> myGroups(@AuthenticationPrincipal CustomUserDetails userDetails) {
        Long userKey = (userDetails != null) ? userDetails.getUserKey() : null;
        if (userKey == null) return ResponseEntity.status(401).build();
        List<GroupVo> groups = groupService.findGroupsByUser(userKey);
        return ResponseEntity.ok(groups);
    }

    @GetMapping("/recommended")
    public ResponseEntity<?> recommended(@RequestParam(required = false) String q) {
        if (q != null && !q.isBlank()) {
            return ResponseEntity.ok(groupService.searchByName(q.trim()));
        }
        return ResponseEntity.ok(groupService.findRecentBySchedule(3));
    }

    @PatchMapping("/{groupId}")
    @PreAuthorize("@groupManageService.isLeaderOrSubLeader(#groupId, principal.userKey)")
    public ResponseEntity<?> updateGroup(@PathVariable Long groupId, @Valid @RequestBody com.moyora.clubschedule.vo.GroupUpdateDto dto) {
        com.moyora.clubschedule.vo.GroupVo toUpdate = new com.moyora.clubschedule.vo.GroupVo();
        toUpdate.setName(dto.getName());
        toUpdate.setDescription(dto.getDescription());
        toUpdate.setCapacity(dto.getCapacity());
        toUpdate.setAutoApprove(dto.getAutoApprove());
        toUpdate.setSchedulePolicy(dto.getSchedulePolicy());
        boolean ok = groupManageService.updateGroupBasicInfo(groupId, toUpdate);
        if (ok) return ResponseEntity.ok().build();
        return ResponseEntity.badRequest().build();
    }

    @PutMapping("/{groupId}/favorite")
    public ResponseEntity<?> setFavoriteGroup(@PathVariable Long groupId, @AuthenticationPrincipal CustomUserDetails userDetails) {
        Long userKey = (userDetails != null) ? userDetails.getUserKey() : null;
        if (userKey == null) return ResponseEntity.status(401).build();
        if (!groupManageService.isMember(groupId, userKey)) return ResponseEntity.status(403).build();
        userService.updateFavoriteGroup(userKey, groupId);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{groupId}/favorite")
    public ResponseEntity<?> clearFavoriteGroup(@PathVariable Long groupId, @AuthenticationPrincipal CustomUserDetails userDetails) {
        Long userKey = (userDetails != null) ? userDetails.getUserKey() : null;
        if (userKey == null) return ResponseEntity.status(401).build();
        UserVo user = userService.getUserByUserKey(userKey);
        if (user != null && groupId.equals(user.getFavoriteGroupId())) {
            userService.updateFavoriteGroup(userKey, null);
        }
        return ResponseEntity.ok().build();
    }
}
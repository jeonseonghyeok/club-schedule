package com.moyora.clubschedule.controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import jakarta.validation.Valid;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import com.moyora.clubschedule.security.CustomUserDetails;
import com.moyora.clubschedule.service.GroupManageService;
import com.moyora.clubschedule.service.GroupPermissionService;
import com.moyora.clubschedule.service.GroupService;
import com.moyora.clubschedule.service.UserService;
import com.moyora.clubschedule.vo.GroupVo;
import com.moyora.clubschedule.vo.UserVo;

@RestController
@RequestMapping("/api/groups")
public class GroupController {

    @Autowired
    private GroupService groupService;
    @Autowired
    private GroupManageService groupManageService;
    @Autowired
    private UserService userService;

    @Autowired
    private GroupPermissionService groupPermissionService;

    /**
     * 모임 화면용 상세: 모임 정보 + 현재 사용자 기준 권한/상태
     * (리더·매니저·멤버 여부, 일정 등록/관리 권한, 공개 범위, 우선모임 여부).
     */
    @GetMapping("/{groupId}")
    public ResponseEntity<?> detail(@PathVariable Long groupId, @AuthenticationPrincipal CustomUserDetails userDetails) {
        GroupVo group = groupService.findById(groupId);
        if (group == null) {
            return ResponseEntity.status(404).body(Map.of("error", "NotFound", "message", "모임을 찾을 수 없습니다."));
        }
        Long userKey = (userDetails != null) ? userDetails.getUserKey() : null;
        boolean isLeader  = userKey != null && userKey.equals(group.getLeaderUserKey());
        boolean isManager = isLeader || groupManageService.isManager(groupId, userKey);
        boolean isMember  = groupManageService.isMember(groupId, userKey);
        GroupPermissionService.SchedulePermissions sp = isLeader
                ? new GroupPermissionService.SchedulePermissions(true, false, true)
                : groupPermissionService.resolveSchedulePermissions(groupId, userKey);
        Long favoriteGroupId = null;
        if (userKey != null) {
            UserVo user = userService.getUserByUserKey(userKey);
            favoriteGroupId = (user != null) ? user.getFavoriteGroupId() : null;
        }

        Map<String, Object> viewer = new HashMap<>();
        viewer.put("userKey", userKey);
        viewer.put("isLeader", isLeader);
        viewer.put("isManager", isManager);
        viewer.put("isMember", isMember);
        viewer.put("canCreateSchedule", sp.isCanCreate());
        viewer.put("createNeedsApproval", sp.isCreateNeedsApproval());
        viewer.put("canManageSchedule", sp.isCanManage());
        viewer.put("isFavoriteGroup", groupId.equals(favoriteGroupId));
        viewer.put("hasFavoriteGroup", favoriteGroupId != null);

        Map<String, Object> resp = new HashMap<>();
        resp.put("group", group);
        resp.put("visibilityType", groupPermissionService.resolveVisibilityType(groupId).name());
        resp.put("viewer", viewer);
        return ResponseEntity.ok(resp);
    }

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
    @PreAuthorize("@groupManageService.isManager(#groupId, principal.userKey)")
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
package com.moyora.clubschedule.controller;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import com.moyora.clubschedule.security.CustomUserDetails;
import com.moyora.clubschedule.service.GroupManageService;
import com.moyora.clubschedule.service.GroupPermissionService;
import com.moyora.clubschedule.service.GroupService;
import com.moyora.clubschedule.service.UserService;
import com.moyora.clubschedule.vo.GroupVo;
import com.moyora.clubschedule.vo.UserVo;

import lombok.RequiredArgsConstructor;

@Controller
@RequiredArgsConstructor
public class GroupViewController {

    private final GroupService           groupService;
    private final GroupManageService     groupManageService;
    private final GroupPermissionService groupPermissionService;
    private final UserService            userService;

    @GetMapping("/groups/{groupId}")
    public String manageView(@PathVariable Long groupId,
                             @AuthenticationPrincipal CustomUserDetails userDetails,
                             Model model) {
        GroupVo group = groupService.findById(groupId);
        if (group == null) {
            return "redirect:/groups";
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
        boolean isFavoriteGroup  = groupId.equals(favoriteGroupId);
        boolean hasFavoriteGroup = favoriteGroupId != null;

        model.addAttribute("group",               group);
        model.addAttribute("isLeader",            isLeader);
        model.addAttribute("isManager",           isManager);
        model.addAttribute("isMember",            isMember);
        model.addAttribute("currentUserKey",      userKey);
        model.addAttribute("canCreateSchedule",   sp.isCanCreate());
        model.addAttribute("createNeedsApproval", sp.isCreateNeedsApproval());
        model.addAttribute("canManageSchedule",   sp.isCanManage());
        model.addAttribute("visibilityType",      groupPermissionService.resolveVisibilityType(groupId).name());
        model.addAttribute("isFavoriteGroup",     isFavoriteGroup);
        model.addAttribute("hasFavoriteGroup",    hasFavoriteGroup);

        return "group";
    }
}

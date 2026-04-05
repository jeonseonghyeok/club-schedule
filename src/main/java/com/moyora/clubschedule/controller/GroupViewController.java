package com.moyora.clubschedule.controller;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import com.moyora.clubschedule.security.CustomUserDetails;
import com.moyora.clubschedule.service.GroupService;
import com.moyora.clubschedule.service.GroupManageService;
import com.moyora.clubschedule.vo.GroupVo;

import lombok.RequiredArgsConstructor;

@Controller
@RequiredArgsConstructor
public class GroupViewController {

    private final GroupService groupService;
    private final GroupManageService groupManageService;

    @GetMapping("/groups/{groupId}")
    public String manageView(@PathVariable("groupId") Long groupId, @AuthenticationPrincipal CustomUserDetails userDetails, Model model) {
        GroupVo group = groupService.findById(groupId);
        if (group == null) {
            return "redirect:/groups"; // 그룹이 없으면 목록으로
        }
        model.addAttribute("group", group);
        Long userKey = (userDetails != null) ? userDetails.getUserKey() : null;
        boolean isLeader = (userKey != null && userKey.equals(group.getLeaderUserKey()));
        boolean isLeaderOrCoLeader = groupManageService.isLeaderOrSubLeader(groupId, userKey);
        boolean isMember = groupManageService.isMember(groupId, userKey);
        model.addAttribute("isLeader", isLeader);
        model.addAttribute("isLeaderOrCoLeader", isLeaderOrCoLeader);
        model.addAttribute("isMember", isMember);
        return "group"; // Thymeleaf 템플릿 이름 (src/main/resources/templates/group.html)
    }
}
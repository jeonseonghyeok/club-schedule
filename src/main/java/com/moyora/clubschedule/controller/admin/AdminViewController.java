package com.moyora.clubschedule.controller.admin;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

import com.moyora.clubschedule.service.GroupRequestService;
import com.moyora.clubschedule.service.GroupJoinRequestService;

@Controller
@RequestMapping("/admin")
public class AdminViewController {

    @Autowired
    private GroupRequestService groupRequestService;

    @Autowired
    private GroupJoinRequestService groupJoinRequestService;

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/group-requests")
    public String viewGroupRequests(Model model) {
        model.addAttribute("pendingRequests", groupRequestService.getPendingRequests());
        return "admin/admin_group_create_requests";
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/group-joins")
    public String viewGroupJoins(Model model) {
        model.addAttribute("pendingJoins", groupJoinRequestService.getAllPending());
        return "admin/admin_group_joins";
    }
}
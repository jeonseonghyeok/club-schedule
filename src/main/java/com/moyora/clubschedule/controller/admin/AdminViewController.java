package com.moyora.clubschedule.controller.admin;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Controller;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

import com.moyora.clubschedule.service.GroupRequestService;
import com.moyora.clubschedule.service.GroupJoinRequestService;
import com.moyora.clubschedule.service.UserService;
import com.moyora.clubschedule.service.GroupService;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.thymeleaf.context.Context;
import org.thymeleaf.spring6.SpringTemplateEngine;
import org.thymeleaf.exceptions.TemplateInputException;
import java.util.Map;

@Controller
@RequestMapping("/admin")
public class AdminViewController {

    @Autowired
    private GroupRequestService groupRequestService;

    @Autowired
    private GroupJoinRequestService groupJoinRequestService;

    @Autowired
    private UserService userService;

    @Autowired
    private GroupService groupService;

    // Template engine for rendering fragments to string for lazy-loading endpoints
    @Autowired
    private SpringTemplateEngine templateEngine;

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/users")
    public String viewUsers(Model model) {
        model.addAttribute("users", userService.listAllUsers());
        model.addAttribute("initialPanel", "usersPanel");
        // Render the admin shell which will include the users fragment
        return "admin";
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/groups")
    public String viewGroups(Model model) {
        model.addAttribute("groups", groupService.findAllGroups());
        model.addAttribute("initialPanel", "groupsPanel");
        return "admin";
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/group-requests")
    public String viewGroupRequests(Model model) {
        model.addAttribute("pendingRequests", groupRequestService.getPendingRequests());
        model.addAttribute("initialPanel", "groupRequestsPanel");
        return "admin";
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/group-joins")
    public String viewGroupJoins(Model model) {
        model.addAttribute("pendingJoins", groupJoinRequestService.getAllPending());
        model.addAttribute("initialPanel", "groupJoinsPanel");
        return "admin";
    }

    // --- Fragment endpoints for lazy-loading -------------------------------------------------
    // These return rendered fragment HTML (text/html) so the client can fetch them asynchronously.

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/fragment/users")
    public ResponseEntity<String> fragmentUsers(HttpServletRequest request, HttpServletResponse response, Model model) {
        model.addAttribute("users", userService.listAllUsers());
        Context ctx = new Context(request.getLocale(), model.asMap());
        String[] candidates = new String[]{"admin/admin_users :: usersPanel", "admin/admin_users", "admin/admin_users.html"};
        for (String candidate : candidates){
            try{
                String html = templateEngine.process(candidate, ctx);
                return ResponseEntity.ok().contentType(MediaType.TEXT_HTML).body(html);
            }catch(TemplateInputException tie){
                // try next candidate
            }
        }
        String msg = "Template not found or inaccessible: tried admin/admin_users variants";
        return ResponseEntity.status(500).contentType(MediaType.TEXT_PLAIN).body(msg);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/fragment/groups")
    public ResponseEntity<String> fragmentGroups(HttpServletRequest request, HttpServletResponse response, Model model) {
        model.addAttribute("groups", groupService.findAllGroups());
        Context ctx = new Context(request.getLocale(), model.asMap());
        String[] candidates = new String[]{"admin/admin_groups :: groupsPanel", "admin/admin_groups", "admin/admin_groups.html"};
        for (String candidate : candidates){
            try{
                String html = templateEngine.process(candidate, ctx);
                return ResponseEntity.ok().contentType(MediaType.TEXT_HTML).body(html);
            }catch(TemplateInputException tie){
                // try next candidate
            }
        }
        String msg = "Template not found or inaccessible: tried admin/admin_groups variants";
        return ResponseEntity.status(500).contentType(MediaType.TEXT_PLAIN).body(msg);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/fragment/group-requests")
    public ResponseEntity<String> fragmentGroupRequests(HttpServletRequest request, HttpServletResponse response, Model model,
                                                       @org.springframework.web.bind.annotation.RequestParam(value = "status", required = false) String status,
                                                       @org.springframework.web.bind.annotation.RequestParam(value = "groupName", required = false) String groupName,
                                                       @org.springframework.web.bind.annotation.RequestParam(value = "page", required = false) Integer page) {
        // page is 1-based; size fixed at 10 per requirement
        Map<String,Object> pageResult = groupRequestService.getRequestsByFilters(status, groupName, page, 10);
        // put items and paging data into model for the fragment template
        model.addAttribute("pendingRequests", pageResult.get("items"));
        int total = ((Number)pageResult.get("total")).intValue();
        int curPage = ((Number)pageResult.get("page")).intValue();
        int pageSize = ((Number)pageResult.get("size")).intValue();
        int totalPages = (total + pageSize - 1) / pageSize;
        model.addAttribute("totalCount", total);
        model.addAttribute("currentPage", curPage);
        model.addAttribute("pageSize", pageSize);
        model.addAttribute("totalPages", totalPages);
        model.addAttribute("selectedStatus", status);
        model.addAttribute("selectedGroupName", groupName);
        Context ctx = new Context(request.getLocale(), model.asMap());
        String[] candidates = new String[]{"admin/admin_group_requests_fragment :: groupRequestsPanel", "admin/admin_group_requests_fragment", "admin/admin_group_requests_fragment.html", "admin/admin_group_requests"};
        for (String candidate : candidates){
            try{
                String html = templateEngine.process(candidate, ctx);
                return ResponseEntity.ok().contentType(MediaType.TEXT_HTML).body(html);
            }catch(TemplateInputException tie){
                // try next candidate
            }
        }
        String msg = "Template not found or inaccessible: tried admin/admin_group_requests_fragment variants";
        return ResponseEntity.status(500).contentType(MediaType.TEXT_PLAIN).body(msg);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/fragment/group-joins")
    public ResponseEntity<String> fragmentGroupJoins(HttpServletRequest request, HttpServletResponse response, Model model) {
        model.addAttribute("pendingJoins", groupJoinRequestService.getAllPending());
        Context ctx = new Context(request.getLocale(), model.asMap());
        String[] candidates = new String[]{"admin/admin_group_joins :: groupJoinsPanel", "admin/admin_group_joins", "admin/admin_group_joins.html"};
        for (String candidate : candidates){
            try{
                String html = templateEngine.process(candidate, ctx);
                return ResponseEntity.ok().contentType(MediaType.TEXT_HTML).body(html);
            }catch(TemplateInputException tie){
                // try next candidate
            }
        }
        String msg = "Template not found or inaccessible: tried admin/admin_group_joins variants";
        return ResponseEntity.status(500).contentType(MediaType.TEXT_PLAIN).body(msg);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/api/group-requests")
    @Transactional(readOnly = true)
    public ResponseEntity<?> apiGroupRequests(@org.springframework.web.bind.annotation.RequestParam(value = "status", required = false) String status,
                                              @org.springframework.web.bind.annotation.RequestParam(value = "groupName", required = false) String groupName,
                                              @org.springframework.web.bind.annotation.RequestParam(value = "page", required = false) Integer page){
        Map<String,Object> pageResult = groupRequestService.getRequestsByFilters(status, groupName, page, 10);
        // normalize response shape for client
        Map<String,Object> resp = new java.util.HashMap<>();
        resp.put("items", pageResult.get("items"));
        resp.put("total", pageResult.get("total"));
        resp.put("page", pageResult.get("page"));
        resp.put("size", pageResult.get("size"));
        resp.put("selectedStatus", status);
        resp.put("selectedGroupName", groupName);
        return ResponseEntity.ok(resp);
    }

}
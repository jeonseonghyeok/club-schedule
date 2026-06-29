package com.moyora.clubschedule.controller.admin;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.moyora.clubschedule.security.CustomUserDetails;
import com.moyora.clubschedule.service.GroupRequestService;
import com.moyora.clubschedule.service.UserService;
import com.moyora.clubschedule.service.GroupService;
import com.moyora.clubschedule.service.GroupJoinRequestService;
import com.moyora.clubschedule.vo.PagingResponse;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/admin/api")
public class AdminApiController {

    @Autowired
    private UserService userService;

    @Autowired
    private GroupService groupService;

    @Autowired
    private GroupJoinRequestService groupJoinRequestService;

    @Autowired
    private GroupRequestService groupRequestService;

    // Helper: common paging + optional query filtering logic - now returns PagingResponse
    private <T> PagingResponse<T> buildPagedResponse(List<T> all, Integer page, Integer size, String q) {
        if (all == null) all = Collections.emptyList();
        final String query = (q == null) ? null : q.trim().toLowerCase();
        List<T> filtered = all;
        if (query != null && !query.isEmpty()){
            filtered = (List<T>) filtered.stream().filter(o -> {
                try{
                    String s = o.toString().toLowerCase();
                    return s.contains(query);
                }catch(Exception e){ return false; }
            }).collect(Collectors.toList());
        }
        int total = filtered.size();
        int pg = (page == null || page < 1) ? 1 : page;
        int sz = (size == null || size < 1) ? 25 : size;
        int from = Math.min(total, (pg - 1) * sz);
        int to = Math.min(total, from + sz);
        List<T> items = filtered.subList(from, to);

        PagingResponse<T> resp = new PagingResponse<>();
        resp.setTotalCount(total);
        resp.setCurrentPage(pg);
        resp.setSize(sz);
        resp.setItems(items);
        // totalPages/startPage/endPage are calculated if we use constructor; ensure consistent
        resp.setTotalPages((int)((total + sz - 1) / sz));
        int blockSize = 5;
        int currentBlock = (pg - 1) / blockSize;
        resp.setStartPage(currentBlock * blockSize + 1);
        resp.setEndPage(Math.min(resp.getStartPage() + blockSize - 1, resp.getTotalPages()));

        return resp;
    }

    // 사용자 목록: 간단한 서버측 페이징 및 검색(닉네임)
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/users")
    public ResponseEntity<?> apiUsers(@RequestParam(value = "page", required = false) Integer page,
                                      @RequestParam(value = "size", required = false) Integer size,
                                      @RequestParam(value = "q", required = false) String q) {
        // If page parameter provided, use DB-level paging via UserService.findUsersPaged
        if (page != null){
            int sz = (size == null || size < 1) ? 25 : size;
            int pg = Math.max(1, page);
            List<?> items = userService.findUsersPaged(q, pg, sz);
            int total = userService.countUsersFiltered(q);
            PagingResponse<Object> resp = new PagingResponse<>();
            resp.setTotalCount(total);
            resp.setCurrentPage(pg);
            resp.setSize(sz);
            resp.setItems((List<Object>) items);
            resp.setTotalPages((int)((total + sz -1)/sz));
            int blockSize = 5; int currentBlock = (pg -1)/blockSize;
            resp.setStartPage(currentBlock*blockSize +1);
            resp.setEndPage(Math.min(resp.getStartPage() + blockSize -1, resp.getTotalPages()));
            return ResponseEntity.ok(resp);
        }

        List<?> all = userService.listAllUsers();
        PagingResponse<?> resp = buildPagedResponse(all, page, size, q);
        return ResponseEntity.ok(resp);
    }

    // 그룹 목록: 페이징 및 검색(그룹명)
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/groups")
    public ResponseEntity<?> apiGroups(@RequestParam(value = "page", required = false) Integer page,
                                       @RequestParam(value = "size", required = false) Integer size,
                                       @RequestParam(value = "q", required = false) String q) {
        if (page != null){
            int sz = (size == null || size < 1) ? 25 : size;
            int pg = Math.max(1, page);
            List<?> items = groupService.findGroupsPaged(q, pg, sz);
            int total = groupService.countGroupsFiltered(q);
            PagingResponse<Object> resp = new PagingResponse<>();
            resp.setTotalCount(total);
            resp.setCurrentPage(pg);
            resp.setSize(sz);
            resp.setItems((List<Object>) items);
            resp.setTotalPages((int)((total + sz -1)/sz));
            int blockSize = 5; int currentBlock = (pg -1)/blockSize;
            resp.setStartPage(currentBlock*blockSize +1);
            resp.setEndPage(Math.min(resp.getStartPage() + blockSize -1, resp.getTotalPages()));
            return ResponseEntity.ok(resp);
        }
        List<?> all = groupService.findAllGroups();
        PagingResponse<?> resp = buildPagedResponse(all, page, size, q);
        return ResponseEntity.ok(resp);
    }

    // group-requests: 목록 조회 (status + q 필터, 페이징)
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/group-requests")
    public ResponseEntity<?> apiGroupRequests(
            @RequestParam(value = "page",   required = false) Integer page,
            @RequestParam(value = "size",   required = false) Integer size,
            @RequestParam(value = "status", required = false) String status,
            @RequestParam(value = "q",      required = false) String q) {

        Map<String, Object> result = groupRequestService.getRequestsByFilters(status, q, page, size);
        int total = (int) result.get("total");
        int pg    = (int) result.get("page");
        int sz    = (int) result.get("size");

        PagingResponse<Object> resp = new PagingResponse<>();
        resp.setItems((List<Object>) result.get("items"));
        resp.setTotalCount(total);
        resp.setCurrentPage(pg);
        resp.setSize(sz);
        resp.setTotalPages((total + sz - 1) / sz);
        int blockSize = 5, block = (pg - 1) / blockSize;
        resp.setStartPage(block * blockSize + 1);
        resp.setEndPage(Math.min(resp.getStartPage() + blockSize - 1, resp.getTotalPages()));
        return ResponseEntity.ok(resp);
    }

    // group-requests: 승인 (생성된 groupId 반환)
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/group-requests/{requestId}/approve")
    public ResponseEntity<?> approveGroupRequest(
            @PathVariable("requestId") Long requestId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        try {
            Long groupId = groupRequestService.approveRequest(requestId, userDetails.getUserKey());
            return ResponseEntity.ok(Map.of("groupId", groupId));
        } catch (RuntimeException ex) {
            return ResponseEntity.status(409).body(Map.of("error", ex.getMessage()));
        }
    }

    // group-requests: 거부
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/group-requests/{requestId}/reject")
    public ResponseEntity<?> rejectGroupRequest(
            @PathVariable("requestId") Long requestId,
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        boolean ok = groupRequestService.rejectGroupRequest(
                requestId, userDetails.getUserKey(), body.get("rejectReason"));
        return ok ? ResponseEntity.ok().build() : ResponseEntity.badRequest().build();
    }

    // group-joins: 간단한 페이징
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/group-joins")
    public ResponseEntity<?> apiGroupJoins(@RequestParam(value = "page", required = false) Integer page,
                                           @RequestParam(value = "size", required = false) Integer size,
                                           @RequestParam(value = "q", required = false) String q) {
        List<?> all = groupJoinRequestService.getAllPending();
        PagingResponse<?> resp = buildPagedResponse(all, page, size, q);
        return ResponseEntity.ok(resp);
    }

}
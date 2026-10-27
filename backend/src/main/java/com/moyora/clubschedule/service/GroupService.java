package com.moyora.clubschedule.service;

import java.time.LocalDate;
import java.util.List;

import org.springframework.stereotype.Service;

import com.moyora.clubschedule.mapper.GroupMapper;
import com.moyora.clubschedule.mapper.GroupMemberMapper;
import com.moyora.clubschedule.mapper.CommonPagingExamplesMapper;
import com.moyora.clubschedule.vo.GroupVo;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class GroupService {

    private final GroupMapper groupMapper;
    private final GroupMemberMapper groupMemberMapper;
    private final CommonPagingExamplesMapper pagingMapper;

    public GroupVo findById(Long groupId) {
        return groupMapper.findById(groupId);
    }

    public List<GroupVo> findGroupsByUser(Long userKey) {
        return groupMemberMapper.selectGroupsByUser(userKey);
    }

    public List<GroupVo> findAllGroups() {
        return groupMapper.findAllOrderByGroupIdDesc();
    }

    // New: paged groups
    public List<GroupVo> findGroupsPaged(String q, LocalDate from, LocalDate to, int page, int size){
        int pg = Math.max(1, page);
        int sz = Math.max(1, size);
        int offset = (pg - 1) * sz;
        return pagingMapper.selectGroupsPaged(q, from, to, sz, offset);
    }

    public int countGroupsFiltered(String q, LocalDate from, LocalDate to){
        return pagingMapper.countGroupsFiltered(q, from, to);
    }

    public List<GroupVo> findRecentBySchedule(int limit) {
        return groupMapper.findRecentBySchedule(limit);
    }

    public List<GroupVo> searchByName(String q) {
        return groupMapper.searchByName(q);
    }
}
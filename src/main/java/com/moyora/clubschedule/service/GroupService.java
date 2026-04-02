package com.moyora.clubschedule.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.moyora.clubschedule.mapper.GroupMapper;
import com.moyora.clubschedule.mapper.GroupMemberMapper;
import com.moyora.clubschedule.vo.GroupVo;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class GroupService {

    private final GroupMapper groupMapper;
    private final GroupMemberMapper groupMemberMapper;

    public GroupVo findById(Long groupId) {
        return groupMapper.findById(groupId);
    }

    public List<GroupVo> findGroupsByUser(Long userKey) {
        return groupMemberMapper.selectGroupsByUser(userKey);
    }
}

package com.moyora.clubschedule.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.moyora.clubschedule.mapper.GroupScheduleMapper;
import com.moyora.clubschedule.vo.GroupScheduleVo;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class GroupScheduleService {

    private final GroupScheduleMapper groupScheduleMapper;

    public List<GroupScheduleVo> listSchedules(Long groupId) {
        return groupScheduleMapper.selectByGroupId(groupId);
    }

    public int countSchedules(Long groupId) {
        return groupScheduleMapper.countByGroupId(groupId);
    }
}

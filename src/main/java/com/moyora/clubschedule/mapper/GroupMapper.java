package com.moyora.clubschedule.mapper;

import java.util.List;

import org.apache.ibatis.annotations.Mapper;

import com.moyora.clubschedule.vo.GroupVo;

@Mapper
public interface GroupMapper {
    GroupVo findById(Long groupId);
    void insert(GroupVo group);
    int update(GroupVo group);
    int countByLeaderUserKey(Long leaderUserKey);

    List<GroupVo> findAllOrderByGroupIdDesc();
}
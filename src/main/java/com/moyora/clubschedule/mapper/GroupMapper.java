package com.moyora.clubschedule.mapper;

import java.util.List;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import com.moyora.clubschedule.vo.GroupVo;

@Mapper
public interface GroupMapper {
    GroupVo findById(Long groupId);
    void insert(GroupVo group);
    int update(GroupVo group);
    int countByLeaderUserKey(Long leaderUserKey);

    List<GroupVo> findAllOrderByGroupIdDesc();

    List<GroupVo> findRecentBySchedule(@Param("limit") int limit);

    List<GroupVo> searchByName(@Param("q") String q);
}
package com.moyora.clubschedule.mapper;

import org.apache.ibatis.annotations.Mapper;

import com.moyora.clubschedule.vo.GroupVo;

@Mapper
public interface GroupMapper {
    GroupVo findById(Long groupId);
    void insert(GroupVo group);
}

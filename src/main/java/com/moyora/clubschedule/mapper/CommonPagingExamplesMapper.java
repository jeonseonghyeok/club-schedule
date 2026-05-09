package com.moyora.clubschedule.mapper;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.Map;

import com.moyora.clubschedule.vo.UserVo;
import com.moyora.clubschedule.vo.GroupVo;

@Mapper
public interface CommonPagingExamplesMapper {
    List<UserVo> selectUsersPaged(@Param("q") String q, @Param("size") int size, @Param("offset") int offset);
    int countUsersFiltered(@Param("q") String q);

    List<GroupVo> selectGroupsPaged(@Param("q") String q, @Param("size") int size, @Param("offset") int offset);
    int countGroupsFiltered(@Param("q") String q);
}

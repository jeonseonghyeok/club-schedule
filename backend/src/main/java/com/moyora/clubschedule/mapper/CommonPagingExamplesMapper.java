package com.moyora.clubschedule.mapper;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

import com.moyora.clubschedule.vo.UserVo;
import com.moyora.clubschedule.vo.GroupVo;

@Mapper
public interface CommonPagingExamplesMapper {
    // role: USER|ADMIN, from/to: 가입일 범위(포함, null 이면 제한 없음)
    List<UserVo> selectUsersPaged(@Param("q") String q, @Param("role") String role,
                                  @Param("from") LocalDate from, @Param("to") LocalDate to,
                                  @Param("size") int size, @Param("offset") int offset);
    int countUsersFiltered(@Param("q") String q, @Param("role") String role,
                           @Param("from") LocalDate from, @Param("to") LocalDate to);

    // from/to: 생성일 범위(포함)
    List<GroupVo> selectGroupsPaged(@Param("q") String q, @Param("from") LocalDate from, @Param("to") LocalDate to,
                                    @Param("size") int size, @Param("offset") int offset);
    int countGroupsFiltered(@Param("q") String q, @Param("from") LocalDate from, @Param("to") LocalDate to);
}

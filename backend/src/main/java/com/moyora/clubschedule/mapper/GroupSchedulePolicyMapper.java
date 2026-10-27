package com.moyora.clubschedule.mapper;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import com.moyora.clubschedule.dto.GroupPolicyUpdateDto;
import com.moyora.clubschedule.vo.GroupSchedulePolicyVo;

@Mapper
public interface GroupSchedulePolicyMapper {

    /** 그룹 일정 운영 정책 조회. 미설정 그룹은 null 반환 */
    GroupSchedulePolicyVo selectByGroupId(@Param("groupId") Long groupId);

    /** 그룹 생성 시 기본 정책 행 삽입. 이미 존재하면 무시(INSERT IGNORE) */
    int insertDefaultPolicy(@Param("groupId") Long groupId);

    /** 정책 전체 교체(행이 없으면 생성) */
    int upsertPolicy(@Param("groupId") Long groupId,
                     @Param("policy") GroupPolicyUpdateDto policy,
                     @Param("updatedBy") Long updatedBy);
}

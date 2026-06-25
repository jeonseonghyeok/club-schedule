package com.moyora.clubschedule.mapper;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface GroupMemberPermissionMapper {

    /** is_allowed=1 인 행이 존재하면 1, 없으면 0 */
    int countPermission(
            @Param("groupId") Long groupId,
            @Param("userKey") Long userKey,
            @Param("permissionType") String permissionType);

    /** 해당 행의 is_allowed 값을 반환. 행이 없으면 null (개인 override 존재 여부 판별용) */
    Integer findIsAllowed(
            @Param("groupId") Long groupId,
            @Param("userKey") Long userKey,
            @Param("permissionType") String permissionType);
}

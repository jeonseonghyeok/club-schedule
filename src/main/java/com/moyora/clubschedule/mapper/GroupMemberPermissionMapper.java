package com.moyora.clubschedule.mapper;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface GroupMemberPermissionMapper {

    /**
     * 특정 유저가 해당 그룹에서 permissionType 권한을 보유하고 있는지 확인.
     * is_allowed = 1 인 행이 존재하면 1, 없으면 0을 반환한다.
     */
    int countPermission(
            @Param("groupId") Long groupId,
            @Param("userKey") Long userKey,
            @Param("permissionType") String permissionType);
}

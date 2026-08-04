package com.moyora.clubschedule.mapper;

import java.util.List;

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

    /** is_allowed=1로 부여(이미 있으면 갱신) */
    int upsertPermission(
            @Param("groupId") Long groupId,
            @Param("userKey") Long userKey,
            @Param("permissionType") String permissionType,
            @Param("grantedBy") Long grantedBy);

    /** 개인 override 행 삭제(회수) */
    int deletePermission(
            @Param("groupId") Long groupId,
            @Param("userKey") Long userKey,
            @Param("permissionType") String permissionType);

    /** 해당 유저가 is_allowed=1로 보유한 permission_type 목록 (프리셋 UI 렌더링용) */
    List<String> selectAllowedTypes(
            @Param("groupId") Long groupId,
            @Param("userKey") Long userKey);
}

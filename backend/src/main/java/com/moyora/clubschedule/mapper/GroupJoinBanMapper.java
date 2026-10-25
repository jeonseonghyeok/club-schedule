package com.moyora.clubschedule.mapper;

import java.util.List;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import com.moyora.clubschedule.vo.GroupJoinBanVo;

@Mapper
public interface GroupJoinBanMapper {
    GroupJoinBanVo selectByGroupAndUser(@Param("groupId") Long groupId, @Param("userKey") Long userKey);

    List<GroupJoinBanVo> selectByGroup(@Param("groupId") Long groupId);

    /** 이미 밴 되어 있으면 사유/처리자/일시를 갱신하고 active=1로 재활성화, 없으면 새로 INSERT */
    int upsertBan(GroupJoinBanVo vo);

    /** 삭제하지 않고 active=0으로 비활성화 + 해제자/해제일시 기록 (이력 보존) */
    int deactivateBan(@Param("groupId") Long groupId, @Param("userKey") Long userKey,
            @Param("operatorUserKey") Long operatorUserKey);
}

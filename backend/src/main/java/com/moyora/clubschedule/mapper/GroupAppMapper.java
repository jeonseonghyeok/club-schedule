package com.moyora.clubschedule.mapper;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

/** 모임 전용 앱 — 켜기/끄기, 이름·색, 아이콘(group_app_icon) */
@Mapper
public interface GroupAppMapper {

    int updateEnabled(@Param("groupId") Long groupId, @Param("enabled") boolean enabled);

    int updateBranding(@Param("groupId") Long groupId,
                       @Param("appName") String appName,
                       @Param("themeColor") String themeColor);

    int upsertIcon(@Param("groupId") Long groupId, @Param("png") byte[] png);

    /** 512px PNG — 없으면 null */
    com.moyora.clubschedule.vo.GroupAppIconVo selectIcon(@Param("groupId") Long groupId);

    /** 아이콘 갱신 시각(매니페스트의 캐시 무효화용) — 없으면 null */
    java.time.LocalDateTime selectIconUpdatedAt(@Param("groupId") Long groupId);
}

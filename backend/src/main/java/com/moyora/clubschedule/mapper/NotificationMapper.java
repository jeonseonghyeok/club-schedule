package com.moyora.clubschedule.mapper;

import java.util.List;

import com.moyora.clubschedule.vo.Notification;
import com.moyora.clubschedule.vo.NotificationListItem;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface NotificationMapper {
    void insertNotification(Notification notification);

    // groupId: null 이면 전체, 있으면 그 모임 알림만(모임 전용 앱)
    List<NotificationListItem> selectRecentByUserKey(@Param("userKey") Long userKey, @Param("limit") int limit,
                                                     @Param("groupId") Long groupId);

    int countUnreadByUserKey(@Param("userKey") Long userKey, @Param("groupId") Long groupId);

    int markRead(@Param("notificationId") Long notificationId, @Param("userKey") Long userKey);

    int markAllRead(@Param("userKey") Long userKey, @Param("groupId") Long groupId);
}

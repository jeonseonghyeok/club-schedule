package com.moyora.clubschedule.mapper;

import java.util.List;

import com.moyora.clubschedule.vo.Notification;
import com.moyora.clubschedule.vo.NotificationListItem;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface NotificationMapper {
    void insertNotification(Notification notification);

    List<NotificationListItem> selectRecentByUserKey(@Param("userKey") Long userKey, @Param("limit") int limit);

    int countUnreadByUserKey(@Param("userKey") Long userKey);

    int markRead(@Param("notificationId") Long notificationId, @Param("userKey") Long userKey);

    int markAllRead(@Param("userKey") Long userKey);
}

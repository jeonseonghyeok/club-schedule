package com.moyora.clubschedule.mapper;

import com.moyora.clubschedule.vo.Notification;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface NotificationMapper {
    void insertNotification(Notification notification);
}

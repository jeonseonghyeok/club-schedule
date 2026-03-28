package com.moyora.clubschedule.service;

import com.moyora.clubschedule.mapper.NotificationMapper;
import com.moyora.clubschedule.vo.Notification;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class NotificationService {
    private final NotificationMapper notificationMapper;

    public void createNotification(Notification notification) {
        notificationMapper.insertNotification(notification);
    }
}

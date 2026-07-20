package com.moyora.clubschedule.service;

import java.util.List;

import com.moyora.clubschedule.mapper.NotificationMapper;
import com.moyora.clubschedule.vo.Notification;
import com.moyora.clubschedule.vo.NotificationListItem;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class NotificationService {
    private static final int MAX_LIST_SIZE = 30;

    private final NotificationMapper notificationMapper;

    public void createNotification(Notification notification) {
        notificationMapper.insertNotification(notification);
    }

    public List<NotificationListItem> listRecent(Long userKey, int limit) {
        int safeLimit = Math.min(Math.max(limit, 1), MAX_LIST_SIZE);
        return notificationMapper.selectRecentByUserKey(userKey, safeLimit);
    }

    public int unreadCount(Long userKey) {
        return notificationMapper.countUnreadByUserKey(userKey);
    }

    public boolean markRead(Long notificationId, Long userKey) {
        return notificationMapper.markRead(notificationId, userKey) > 0;
    }

    public int markAllRead(Long userKey) {
        return notificationMapper.markAllRead(userKey);
    }
}

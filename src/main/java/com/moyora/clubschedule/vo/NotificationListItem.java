package com.moyora.clubschedule.vo;

import java.util.Date;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class NotificationListItem {
    private Long notificationId;
    private String sourceTable;
    private Long sourceId;
    private String category;
    private String title;
    private String content;
    private Boolean isRead;
    private Date createdAt;
    private Long groupId; // source_table 기준으로 조회 시점에 resolve, 없으면 null
}

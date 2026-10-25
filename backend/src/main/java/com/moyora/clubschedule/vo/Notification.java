package com.moyora.clubschedule.vo;

import java.util.Date;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class Notification {
    private Long notificationId;
    private Long userKey;
    private String sourceTable; // enum: GROUP_CREATE_REQUEST, GROUP_JOIN_REQUEST, SCHEDULE
    private Long sourceId;
    private String category; // enum: APPROVE, REJECT, NOTICE
    private String title;
    private String content;
    private Boolean isRead;
    private Date createdAt;
}

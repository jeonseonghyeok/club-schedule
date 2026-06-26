package com.moyora.clubschedule.vo;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import lombok.Data;

@Data
public class GroupScheduleHistoryVo {
    private Long historyId;
    private Long scheduleId;
    private Long groupId;
    private Long changedBy;
    private String changeReason;
    private String title;
    private String content;
    private String locationName;
    private BigDecimal latitude;
    private BigDecimal longitude;
    private LocalDateTime startAt;
    private LocalDateTime endAt;
    private int maxAttendance;
    private GroupScheduleVo.ScheduleStatus status;
    private LocalDateTime changedAt;
}

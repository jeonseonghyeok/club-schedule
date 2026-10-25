package com.moyora.clubschedule.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import lombok.Data;

@Data
public class GroupScheduleEditDto {
    private Long scheduleId;
    private Long groupId;
    private String changeReason;
    private String title;
    private String content;
    private String locationName;
    private BigDecimal latitude;
    private BigDecimal longitude;
    private LocalDateTime startAt;
    private LocalDateTime endAt;
    private int maxAttendance;
}

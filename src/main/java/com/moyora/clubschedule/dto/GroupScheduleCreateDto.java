package com.moyora.clubschedule.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import com.moyora.clubschedule.vo.GroupScheduleVo.ScheduleStatus;

import lombok.Data;

@Data
public class GroupScheduleCreateDto {
    private Long scheduleId;       // INSERT 후 useGeneratedKeys로 채워짐
    private Long groupId;
    private String title;
    private String content;
    private String locationName;
    private BigDecimal latitude;
    private BigDecimal longitude;
    private LocalDateTime startAt;
    private LocalDateTime endAt;
    private int maxAttendance;     // 0 = 무제한
    private ScheduleStatus status = ScheduleStatus.PENDING;
    private Long createdBy;
}

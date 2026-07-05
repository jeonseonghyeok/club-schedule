package com.moyora.clubschedule.vo;

import java.time.LocalDateTime;
import lombok.Data;

@Data
public class ScheduleAttendanceCheckHistoryVo {
    private Long historyId;
    private Long attendanceId;
    private Long scheduleId;
    private Long userKey;
    private ScheduleAttendanceVo.ActualStatus previousActualStatus;
    private ScheduleAttendanceVo.ActualStatus newActualStatus;
    private Long changedBy;
    private String changeReason;
    private LocalDateTime changedAt;
}

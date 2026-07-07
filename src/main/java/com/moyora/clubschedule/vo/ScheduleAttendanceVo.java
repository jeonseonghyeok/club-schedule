package com.moyora.clubschedule.vo;

import java.time.LocalDateTime;
import lombok.Data;

@Data
public class ScheduleAttendanceVo {
    private Long attendanceId;
    private Long scheduleId;
    private Long userKey;
    private String displayName;
    private AttendanceStatus status;
    private ActualStatus actualStatus;
    private int isLatest;
    private Long processedByUserKey;
    private Long updatedBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime checkedAt;
    private Long checkedByUserKey;
    private String actorDisplayName; // 이력 조회 전용 — updated_by(작업자)의 표시 이름

    public enum AttendanceStatus { PENDING, CONFIRMED, REJECTED, CANCELLED }
    public enum ActualStatus     { NONE, ATTENDED, NOSHOW }
}

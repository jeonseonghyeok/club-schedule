package com.moyora.clubschedule.vo;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import lombok.Data;
import lombok.NonNull;

@Data
public class GroupScheduleVo {
    @NonNull private final Long scheduleId;
    @NonNull private final Long groupId;
    @NonNull private final String title;
             private final String content;        // nullable
             private final String locationName;   // nullable
             private final BigDecimal latitude;   // nullable
             private final BigDecimal longitude;  // nullable
    @NonNull private final LocalDateTime startAt;
             private final LocalDateTime endAt;   // nullable
             private final int maxAttendance;     // 0 = 무제한
    @NonNull private final ScheduleStatus status;
    @NonNull private final Long createdBy;
             private final Long approvedBy;       // nullable (승인 전)
    @NonNull private final LocalDateTime createdAt;
    @NonNull private final LocalDateTime updatedAt;
             private final boolean isCompleted;
             private final LocalDateTime completedAt; // nullable

    public enum ScheduleStatus {
        PENDING,
        CONFIRMED,
        REJECTED,
        CANCELLED
    }
}

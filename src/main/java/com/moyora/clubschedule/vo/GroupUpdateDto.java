package com.moyora.clubschedule.vo;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class GroupUpdateDto {
    @Size(max = 100, message = "모임 이름은 최대 100자까지 입력 가능합니다.")
    private String name;

    @Size(max = 5000, message = "모임 설명은 너무 깁니다.")
    private String description;

    @Min(value = 1, message = "정원은 최소 1명 이상이어야 합니다.")
    @Max(value = 1000, message = "정원은 최대 1000명까지 허용됩니다.")
    private Integer capacity;

    private Boolean autoApprove;
    private String schedulePolicy; // optional: ALL, LEADERS_ONLY, APPROVAL_REQUIRED
    private Boolean defSubCanSchedule;
    private Boolean defSubCanMember;
    private Boolean defSubCanNickname;
}

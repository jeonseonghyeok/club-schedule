package com.moyora.clubschedule.vo;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * PATCH /api/groups/{groupId} — 모두 선택(null 이면 그대로 둔다).
 * 일정 등록 정책은 group_schedule_policy 가 실제로 쓰이므로 PUT /api/groups/{groupId}/policy 로 바꾼다
 * (group.schedule_policy 컬럼은 권한 판단에 쓰이지 않는다).
 */
@Data
public class GroupUpdateDto {
    @Size(max = 100, message = "모임 이름은 최대 100자까지 입력 가능합니다.")
    @Pattern(regexp = ".*\\S.*", message = "모임 이름을 입력하세요.")
    private String name;

    @Size(max = 5000, message = "모임 설명은 너무 깁니다.")
    private String description;

    @Min(value = 1, message = "정원은 최소 1명 이상이어야 합니다.")
    @Max(value = 1000, message = "정원은 최대 1000명까지 허용됩니다.")
    private Integer capacity;

    private Boolean autoApprove;
}

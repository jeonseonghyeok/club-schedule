package com.moyora.clubschedule.vo;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class GroupRequestRejectDto {
    
    @NotNull(message = "신청 ID는 필수입니다.")
    private Long requestId;
    
    @NotNull(message = "거절 사유는 필수입니다.")
    @Size(max = 100, message = "거절 사유는 최대 100자까지 입력 가능합니다.")
    private String rejectReason;
}
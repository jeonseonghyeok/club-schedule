package com.moyora.clubschedule.vo;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class GroupRequestCancelDto {
    
    @NotNull(message = "신청 ID는 필수입니다.")
    private Long requestId;
}
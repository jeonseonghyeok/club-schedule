package com.moyora.clubschedule.dto;

import java.math.BigDecimal;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Size;
import lombok.Data;

/** PUT /api/groups/{groupId}/region — 셋 다 null 이면 해제 */
@Data
public class GroupRegionDto {
    @Size(max = 100, message = "활동 지역 이름은 100자까지 입력할 수 있습니다.")
    private String regionName;

    @DecimalMin(value = "-90", message = "위도가 올바르지 않습니다.")
    @DecimalMax(value = "90", message = "위도가 올바르지 않습니다.")
    private BigDecimal latitude;

    @DecimalMin(value = "-180", message = "경도가 올바르지 않습니다.")
    @DecimalMax(value = "180", message = "경도가 올바르지 않습니다.")
    private BigDecimal longitude;
}

package com.moyora.clubschedule.vo;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class GroupRequestDto {

    @NotNull(message = "요청자(userKey)는 필수입니다.")
    private Long userKey;

    @NotBlank(message = "모임 이름은 필수입니다.")
    @Size(max = 100, message = "모임 이름은 최대 100자까지 입력 가능합니다.")
    private String groupName;

    @Size(max = 5000, message = "모임 설명은 너무 깁니다.")
    private String description;

}

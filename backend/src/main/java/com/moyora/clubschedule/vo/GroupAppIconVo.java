package com.moyora.clubschedule.vo;

import lombok.Data;

/** group_app_icon 행 — PNG 바이트 */
@Data
public class GroupAppIconVo {
    private Long groupId;
    private byte[] png;
}

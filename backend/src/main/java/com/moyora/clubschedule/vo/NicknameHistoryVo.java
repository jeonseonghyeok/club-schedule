package com.moyora.clubschedule.vo;

import java.time.LocalDateTime;

import lombok.Data;

/** 닉네임 변경 이력 한 건 — groupId 가 null 이면 계정 닉네임 */
@Data
public class NicknameHistoryVo {
    private Long historyId;
    private Long userKey;
    private Long groupId;
    private String groupName;
    private String oldNickname;
    private String newNickname;
    private Long changedBy;
    private String changedByName; // 바꾼 사람의 표시 이름(모임 이력이면 그 모임 닉네임)
    private LocalDateTime createdAt;
}

package com.moyora.clubschedule.vo;

import com.moyora.clubschedule.exception.GroupAccessDeniedException;

public enum GroupRole {
    LEADER,
    MANAGER,
    MEMBER;

    public static GroupRole from(String value) {
        if (value == null) throw new GroupAccessDeniedException("그룹 멤버가 아닙니다.");
        try {
            return valueOf(value.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new GroupAccessDeniedException("알 수 없는 역할입니다: " + value);
        }
    }
}

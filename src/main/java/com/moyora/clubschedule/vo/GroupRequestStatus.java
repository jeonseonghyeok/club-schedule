package com.moyora.clubschedule.vo;

public enum GroupRequestStatus {
    PENDING,
    /** 승인 처리 중(동시 승인 방지용, 일시적) */
    PROCESSING,
    APPROVED,
    REJECTED,
    CANCELLED
}
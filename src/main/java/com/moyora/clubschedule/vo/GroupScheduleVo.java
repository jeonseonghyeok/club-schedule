package com.moyora.clubschedule.vo;

import java.util.Date;
import lombok.Data;

@Data
public class GroupScheduleVo {
	private final Long scheduleId;       // 스케줄 고유 키 (bigint unsigned)
    private final Long groupId;          // 소속 그룹 키 (bigint unsigned)
    private final String title;          // 일정 제목 (varchar(100))
    private final String content;        // 일정 상세 내용 (text)
    private final String locationName;   // 장소 명칭 (varchar(255))
    private final String latitude;   // 위도 (decimal(10,8))
    private final String longitude;  // 경도 (decimal(11,8))
    private final String startAt; // 모임 시작 시간 (datetime)
    private final String endAt;   // 모임 종료 시간 (datetime)
    private final Integer maxAttendance; // 최대 인원 제한 (int unsigned)
    private final ScheduleStatus status; // 일정 상태 (enum)
    private final Long createdBy;        // 작성자 user_key (bigint unsigned)
    private final Long approvedBy;       // 승인/반려 처리자 user_key (bigint unsigned)
    private final String createdAt; // 생성 일시 (datetime)
    private final String updatedAt; // 수정 일시 (datetime)
    private final boolean isCompleted;   // 최종 종료 및 정산 여부 (tinyint(1) -> boolean)
    private final String completedAt; // 실제 종료 처리 시점 (datetime)

    /**
     * DB의 ENUM과 매핑되는 내부 Enum 클래스
     */
    public enum ScheduleStatus {
        PENDING,    // 승인대기
        CONFIRMED,  // 확정
        REJECTED,   // 반려
		CANCELLED // 취소
	}
}
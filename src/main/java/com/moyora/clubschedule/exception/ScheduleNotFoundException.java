package com.moyora.clubschedule.exception;

public class ScheduleNotFoundException extends RuntimeException {
    public ScheduleNotFoundException(Long scheduleId) {
        super("존재하지 않는 일정입니다. id=" + scheduleId);
    }
}

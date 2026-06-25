package com.moyora.clubschedule.exception;

public class GroupAccessDeniedException extends RuntimeException {
    public GroupAccessDeniedException(String message) {
        super(message);
    }
}

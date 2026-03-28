package com.moyora.clubschedule.exception;

public class DuplicateJoinRequestException extends RuntimeException {
    public DuplicateJoinRequestException() { super(); }
    public DuplicateJoinRequestException(String message) { super(message); }
}

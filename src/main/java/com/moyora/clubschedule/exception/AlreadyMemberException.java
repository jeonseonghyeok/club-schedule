package com.moyora.clubschedule.exception;

public class AlreadyMemberException extends RuntimeException {
    public AlreadyMemberException() { super(); }
    public AlreadyMemberException(String message) { super(message); }
}

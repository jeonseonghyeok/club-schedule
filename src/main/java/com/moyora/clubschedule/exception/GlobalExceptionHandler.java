package com.moyora.clubschedule.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(AlreadyMemberException.class)
    public ResponseEntity<Map<String, String>> handleAlreadyMember(AlreadyMemberException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("error", "Conflict", "message", ex.getMessage()));
    }

    @ExceptionHandler(DuplicateJoinRequestException.class)
    public ResponseEntity<Map<String, String>> handleDuplicateRequest(DuplicateJoinRequestException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("error", "Conflict", "message", ex.getMessage()));
    }

    @ExceptionHandler(GroupAccessDeniedException.class)
    public ResponseEntity<Map<String, String>> handleAccessDenied(GroupAccessDeniedException ex) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(Map.of("error", "Forbidden", "message", ex.getMessage()));
    }

    @ExceptionHandler(ScheduleNotFoundException.class)
    public ResponseEntity<Map<String, String>> handleScheduleNotFound(ScheduleNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(Map.of("error", "NotFound", "message", ex.getMessage()));
    }

    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<Map<String, String>> handleIllegalState(IllegalStateException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(Map.of("error", "Conflict", "message", ex.getMessage()));
    }

    // 기타 예외는 기본 500 처리
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, String>> handleGeneric(Exception ex) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "InternalServerError", "message", ex.getMessage()));
    }
}

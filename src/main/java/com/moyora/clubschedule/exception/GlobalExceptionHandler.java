package com.moyora.clubschedule.exception;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.servlet.resource.NoResourceFoundException;

import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

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

    @ExceptionHandler(org.springframework.security.access.AccessDeniedException.class)
    public ResponseEntity<Map<String, String>> handleSecurityAccessDenied(org.springframework.security.access.AccessDeniedException ex) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(Map.of("error", "Forbidden", "message", "권한이 없습니다."));
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

    @ExceptionHandler(NoResourceFoundException.class)
    public ResponseEntity<Map<String, String>> handleNotFound(NoResourceFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(Map.of("error", "NotFound", "message", ex.getMessage()));
    }

    // 기타 예외는 기본 500 처리. 예상치 못한 예외의 메시지에는 SQL·클래스명·파일 경로 등
    // 내부 구현 정보가 담길 수 있어, 클라이언트에는 일반화된 메시지만 보내고 원본은 서버 로그에만 남긴다.
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, String>> handleGeneric(Exception ex) {
        log.error("처리되지 않은 예외 발생", ex);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "InternalServerError", "message", "일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요."));
    }
}

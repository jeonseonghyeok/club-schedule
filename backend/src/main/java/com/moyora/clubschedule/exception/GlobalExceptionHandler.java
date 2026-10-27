package com.moyora.clubschedule.exception;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.ErrorResponse;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
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
        // 원문에는 요청 경로가 그대로 담겨 있어 일반 문구만 보낸다
        log.debug("없는 경로 요청: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(Map.of("error", "NotFound", "message", "요청한 주소를 찾을 수 없습니다."));
    }

    /** @Valid 요청 본문 검증 실패 — DTO 에 적힌 첫 번째 필드 메시지를 그대로 보여준다 */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, String>> handleValidation(MethodArgumentNotValidException ex) {
        String message = ex.getBindingResult().getFieldErrors().stream()
                .findFirst()
                .map(FieldError::getDefaultMessage)
                .orElse(BAD_REQUEST_MESSAGE);
        return ResponseEntity.badRequest().body(Map.of("error", "BadRequest", "message", message));
    }

    /** 본문 JSON 을 읽을 수 없거나 경로·쿼리 값의 타입이 맞지 않는 요청(예: /api/groups/abc) */
    @ExceptionHandler({ HttpMessageNotReadableException.class, MethodArgumentTypeMismatchException.class })
    public ResponseEntity<Map<String, String>> handleBadRequest(Exception ex) {
        log.debug("잘못된 요청: {}", ex.getMessage());
        return ResponseEntity.badRequest().body(Map.of("error", "BadRequest", "message", BAD_REQUEST_MESSAGE));
    }

    private static final String BAD_REQUEST_MESSAGE = "요청 형식이 올바르지 않습니다.";

    private static final Map<Integer, String> CLIENT_ERROR_MESSAGES = Map.of(
            405, "허용되지 않은 요청 방식입니다.",
            406, "지원하지 않는 응답 형식입니다.",
            415, "지원하지 않는 요청 형식입니다.");

    // 기타 예외는 기본 500 처리. 예상치 못한 예외의 메시지에는 SQL·클래스명·파일 경로 등
    // 내부 구현 정보가 담길 수 있어, 클라이언트에는 일반화된 메시지만 보내고 원본은 서버 로그에만 남긴다.
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, String>> handleGeneric(Exception ex) {
        // 스프링 MVC 가 이미 4xx 상태를 정해 둔 예외(405·415·필수 파라미터 누락 등)는 그 상태를 그대로 쓴다
        if (ex instanceof ErrorResponse errorResponse && errorResponse.getStatusCode().is4xxClientError()) {
            HttpStatusCode status = errorResponse.getStatusCode();
            HttpStatus resolved = HttpStatus.resolve(status.value());
            String error = resolved != null ? resolved.getReasonPhrase().replace(" ", "") : "ClientError";
            String message = CLIENT_ERROR_MESSAGES.getOrDefault(status.value(), BAD_REQUEST_MESSAGE);
            log.debug("클라이언트 오류 {}: {}", status.value(), ex.getMessage());
            return ResponseEntity.status(status).body(Map.of("error", error, "message", message));
        }
        log.error("처리되지 않은 예외 발생", ex);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "InternalServerError", "message", "일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요."));
    }
}

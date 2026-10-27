package com.moyora.clubschedule.exception;

import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

/**
 * 컨트롤러가 직접 돌려주는 에러 응답. GlobalExceptionHandler 와 같은 바디 {error, message} 를 써서
 * 프론트가 어떤 경로의 실패든 message 를 그대로 보여줄 수 있게 한다(빈 본문·평문 응답을 두지 않는다).
 */
public final class ApiErrors {

    private ApiErrors() {}

    public static ResponseEntity<Map<String, String>> of(HttpStatus status, String message) {
        String error = status.getReasonPhrase().replace(" ", "");
        return ResponseEntity.status(status).body(Map.of("error", error, "message", message));
    }

    public static ResponseEntity<Map<String, String>> unauthorized() {
        return of(HttpStatus.UNAUTHORIZED, "로그인이 필요합니다.");
    }

    public static ResponseEntity<Map<String, String>> badRequest(String message) {
        return of(HttpStatus.BAD_REQUEST, message);
    }

    public static ResponseEntity<Map<String, String>> forbidden(String message) {
        return of(HttpStatus.FORBIDDEN, message);
    }

    public static ResponseEntity<Map<String, String>> notFound(String message) {
        return of(HttpStatus.NOT_FOUND, message);
    }

    public static ResponseEntity<Map<String, String>> conflict(String message) {
        return of(HttpStatus.CONFLICT, message);
    }

    public static ResponseEntity<Map<String, String>> serviceUnavailable(String message) {
        return of(HttpStatus.SERVICE_UNAVAILABLE, message);
    }
}

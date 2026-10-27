package com.moyora.clubschedule.controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

import com.moyora.clubschedule.exception.ApiErrors;
import com.moyora.clubschedule.mapper.UserMapper;
import com.moyora.clubschedule.util.TestAuthUtil;
import com.moyora.clubschedule.vo.UserVo;

import lombok.RequiredArgsConstructor;

/**
 * 테스트 계정 로그인. test.auth.secret 이 설정된 경우에만 동작한다.
 * 운영 환경에서는 test.auth.secret 을 비워두어 모든 요청이 503을 반환하도록 한다.
 */
@RestController
@RequiredArgsConstructor
public class TestLoginController {

    private final TestAuthUtil testAuthUtil;
    private final UserMapper   userMapper;

    /**
     * 테스트 계정 목록 API (React 테스트 로그인 화면용).
     * 응답: [{"kakaoApiId": 9900000000001, "nickname": "관리자01"}, ...]
     */
    @GetMapping("/api/login/test/accounts")
    public ResponseEntity<?> testAccounts() {
        if (!testAuthUtil.isEnabled()) {
            return ApiErrors.serviceUnavailable("테스트 인증이 비활성화되어 있습니다.");
        }
        List<Map<String, Object>> accounts = userMapper.selectTestAccounts().stream()
                .map(u -> Map.<String, Object>of(
                        "kakaoApiId", u.getKakaoApiId(),
                        "nickname", u.getNickname() != null ? u.getNickname() : ""))
                .toList();
        return ResponseEntity.ok(accounts);
    }

    /**
     * 테스트 계정 로그인 API.
     * Body: {"kakaoApiId": 9900000000001}
     * 닉네임은 테스트 중 임의로 바뀔 수 있어 유니크하지 않으므로 kakaoApiId로 조회한다.
     * 성공 시 AUTH_TOKEN 쿠키를 설정하고 {userKey, nickname} 반환.
     */
    @PostMapping("/api/login/test")
    public ResponseEntity<?> login(@RequestBody Map<String, Object> body) {
        if (!testAuthUtil.isEnabled()) {
            return ApiErrors.serviceUnavailable("테스트 인증이 비활성화되어 있습니다.");
        }

        Object kakaoApiIdRaw = body.get("kakaoApiId");
        if (kakaoApiIdRaw == null) {
            return ApiErrors.badRequest("kakaoApiId는 필수입니다.");
        }
        Long kakaoApiId = Long.valueOf(kakaoApiIdRaw.toString());

        UserVo user = userMapper.selectByKakaoApiId(kakaoApiId);
        if (user == null) {
            return ApiErrors.notFound("테스트 계정을 찾을 수 없습니다: " + kakaoApiId);
        }

        String token = testAuthUtil.issueToken(user.getUserKey());
        String cookie = "AUTH_TOKEN=" + token + "; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400";

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, cookie)
                .body(Map.of(
                        "userKey",  user.getUserKey(),
                        "nickname", user.getNickname() != null ? user.getNickname() : ""
                ));
    }
}

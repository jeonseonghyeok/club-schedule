package com.moyora.clubschedule.controller;

import java.util.Map;

import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;

import com.moyora.clubschedule.mapper.UserMapper;
import com.moyora.clubschedule.util.TestAuthUtil;
import com.moyora.clubschedule.vo.UserVo;

import lombok.RequiredArgsConstructor;

/**
 * 테스트 계정 로그인. test.auth.secret 이 설정된 경우에만 동작한다.
 * 운영 환경에서는 test.auth.secret 을 비워두어 모든 요청이 503을 반환하도록 한다.
 */
@Controller
@RequestMapping("/login/test")
@RequiredArgsConstructor
public class TestLoginController {

    private final TestAuthUtil testAuthUtil;
    private final UserMapper   userMapper;

    /** 수동 로그인용 UI 페이지 */
    @GetMapping
    public String testLoginPage() {
        if (!testAuthUtil.isEnabled()) return "redirect:/";
        return "test_login";
    }

    /**
     * 테스트 계정 로그인 API.
     * Body: {"username": "test01"}
     * 성공 시 AUTH_TOKEN 쿠키를 설정하고 {userKey, nickname} 반환.
     */
    @PostMapping
    public ResponseEntity<?> login(@RequestBody Map<String, String> body) {
        if (!testAuthUtil.isEnabled()) {
            return ResponseEntity.status(503).body(Map.of("message", "테스트 인증이 비활성화되어 있습니다."));
        }

        String username = body.get("username");
        if (username == null || username.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "username은 필수입니다."));
        }

        UserVo user = userMapper.selectByNickname(username.trim());
        if (user == null) {
            return ResponseEntity.status(404).body(Map.of("message", "테스트 계정을 찾을 수 없습니다: " + username));
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

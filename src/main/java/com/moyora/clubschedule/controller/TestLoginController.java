package com.moyora.clubschedule.controller;

import java.util.Map;

import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseBody;

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
    public String testLoginPage(Model model) {
        if (!testAuthUtil.isEnabled()) return "redirect:/";
        model.addAttribute("testAccounts", userMapper.selectTestAccounts());
        return "test_login";
    }

    /**
     * 테스트 계정 로그인 API.
     * Body: {"kakaoApiId": 9900000000001}
     * 닉네임은 테스트 중 임의로 바뀔 수 있어 유니크하지 않으므로 kakaoApiId로 조회한다.
     * 성공 시 AUTH_TOKEN 쿠키를 설정하고 {userKey, nickname} 반환.
     */
    @PostMapping
    @ResponseBody
    public ResponseEntity<?> login(@RequestBody Map<String, Object> body) {
        if (!testAuthUtil.isEnabled()) {
            return ResponseEntity.status(503).body(Map.of("message", "테스트 인증이 비활성화되어 있습니다."));
        }

        Object kakaoApiIdRaw = body.get("kakaoApiId");
        if (kakaoApiIdRaw == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "kakaoApiId는 필수입니다."));
        }
        Long kakaoApiId = Long.valueOf(kakaoApiIdRaw.toString());

        UserVo user = userMapper.selectByKakaoApiId(kakaoApiId);
        if (user == null) {
            return ResponseEntity.status(404).body(Map.of("message", "테스트 계정을 찾을 수 없습니다: " + kakaoApiId));
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

package com.moyora.clubschedule.controller;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.moyora.clubschedule.service.MemberService;
import com.moyora.clubschedule.util.KakaoTokenUtil;

import jakarta.servlet.http.HttpServletRequest;


@RestController
@RequestMapping("/login")
public class LoginController {
    @Autowired
    private KakaoTokenUtil kakaoTokenUtil;
    @Autowired
    private MemberService memberService;
	/**
     * 카카오 인증을 통한 로그인 페이지
     * 카카오API를 통해 토큰을 발급하고 반환한다.
     */
    @PostMapping("/kakao")
	public ResponseEntity<?> kakaoCallback(@RequestBody Map<String, String> body, HttpServletRequest request) {

        String code = body.get("code");

        // 1. Referer(직전 페이지), Host, Path 정보 획득
        String referer = request.getHeader("Referer"); // ex. http://localhost:3000/sign/login-callback

        // 2. whitelist와 일치 여부 판별
        List<String> redirectWhitelist = kakaoTokenUtil.getRedirectWhitelist();

        // 완전 일치(equals) 검증: 화이트리스트 값과 Referer 비교
        if (referer == null) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body("허용되지 않은 redirect_uri 접근입니다.");
        }

        String refererBase = referer.split("\\?")[0];  // ? 앞까지만 사용

        if (!redirectWhitelist.contains(refererBase)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body("허용되지 않은 redirect_uri 접근입니다.");
        }
        
        // 3. AccessToken 발급 요청
        Map<String, Object> kakaoToken;
        try {
            kakaoToken = kakaoTokenUtil.getToken(code, refererBase);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
                .body("카카오 토큰 발급 실패: " + e.getMessage());
        }

        // 4. 회원 자동가입/로그인 처리
        String kakaoAccessToken = (String) kakaoToken.get("access_token");
        try {
            memberService.autoSignUpByKakaoApi(kakaoAccessToken,refererBase);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("회원 자동가입 처리 중 오류: " + e.getMessage());
        }

        // 5. 성공 응답 반환
        return ResponseEntity.ok(kakaoToken);

    }
    
}
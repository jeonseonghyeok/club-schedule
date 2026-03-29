package com.moyora.clubschedule.controller;

import java.net.MalformedURLException;
import java.net.URI;
import java.net.URISyntaxException;
import java.net.URL;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
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
        String redirectUriFromBody = body.get("redirectUri");
        String returnToFromBody = body.get("returnTo");

        // 1. Determine the redirect URI to use when exchanging code for token.
        // Prefer explicit redirectUri provided by client (browser). Fall back to Referer header when not provided.
        String effectiveRedirect = null;
        if (redirectUriFromBody != null && !redirectUriFromBody.isBlank()) {
            effectiveRedirect = redirectUriFromBody;
        } else {
            String referer = request.getHeader("Referer");
            if (referer != null && !referer.isBlank()) {
                // remove query portion
                effectiveRedirect = referer.split("\\?")[0];
            }
        }

        if (effectiveRedirect == null) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body("허용되지 않은 redirect_uri 접근입니다.");
        }

        // 2. whitelist와 일치 여부 판별(경로만 등록하여 판별)
        List<String> redirectWhitelist = kakaoTokenUtil.getRedirectWhitelist();

        URI uri = null;
        URL url = null;
        String returnPath = "/";
        try {
            uri = new URI(effectiveRedirect);
            url = uri.toURL();

            // path만 비교
            if (!redirectWhitelist.contains(url.getPath())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("허용되지 않은 redirect_uri 접근입니다.");
            }

            // 클라이언트로 전달할 원래 리턴 경로(호스트 제외, 쿼리 포함 가능)
            returnPath = url.getPath() + (uri.getQuery() != null ? "?" + uri.getQuery() : "");

        } catch (URISyntaxException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("redirect_uri 구문 오류입니다.");
        } catch (MalformedURLException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("redirect_uri 형식 오류입니다.");
        }

        // 3. AccessToken 발급 요청
        Map<String, Object> kakaoToken;
        try {
            kakaoToken = kakaoTokenUtil.getToken(code, effectiveRedirect);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
                .body("카카오 토큰 발급 실패: " + e.getMessage());
        }

        // 4. 회원 자동가입/로그인 처리
        String kakaoAccessToken = (String) kakaoToken.get("access_token");
        try {
            memberService.autoSignUpByKakaoApi(kakaoAccessToken,effectiveRedirect);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("회원 자동가입 처리 중 오류: " + e.getMessage());
        }

        // 5. 쿠키에 id_token을 HttpOnly로 저장하여 브라우저가 자동으로 인증에 사용하도록 함
        ResponseEntity.BodyBuilder respBuilder = ResponseEntity.ok();
        Object idTokenObj = kakaoToken.get("id_token");
        if (idTokenObj != null) {
            try {
                String encoded = URLEncoder.encode((String) idTokenObj, StandardCharsets.UTF_8.toString());
                // Max-Age를 토큰 만료 시간에 맞추려면 kakaoToken의 expires_in 값을 사용해 설정할 수 있음
                String cookie = "AUTH_TOKEN=" + encoded + "; Path=/; HttpOnly; SameSite=Lax";
                Object expiresObj = kakaoToken.get("expires_in");
                if (expiresObj != null) {
                    try {
                        int expiresSec = Integer.parseInt(String.valueOf(expiresObj));
                        cookie += "; Max-Age=" + expiresSec;
                    } catch (NumberFormatException nfe) {
                        // 무시
                    }
                }
                 respBuilder.header(HttpHeaders.SET_COOKIE, cookie);
             } catch (Exception e) {
                 // 인코딩 에러가 발생해도 인증 흐름 자체는 실패시키지 않음
             }
         }

        // 6. 성공 응답 반환 (클라이언트는 쿠키를 수신하고 이후 리다이렉트 경로로 이동)
        // Prefer explicit returnTo from client; fallback to returnPath derived from redirectUri
        String finalReturn = (returnToFromBody != null && !returnToFromBody.isBlank()) ? returnToFromBody : returnPath;
        // Safety: if finalReturn points back to the login callback path itself, this would cause
        // the client to reload the callback page (no code) and re-trigger the OAuth flow -> loop.
        try {
            String callbackPath = new URI(effectiveRedirect).getPath();
            if (finalReturn == null || finalReturn.isBlank() || finalReturn.equals(callbackPath) || finalReturn.equals(effectiveRedirect)) {
                finalReturn = "/"; // default safe landing
            }
        } catch (Exception e) {
            if (finalReturn == null || finalReturn.isBlank()) finalReturn = "/";
        }
        kakaoToken.put("return_path", finalReturn);

        // return the response with cookie (if set) and return_path
        return respBuilder.body(kakaoToken);

    }
    
}
package com.moyora.clubschedule.controller;

import java.util.Map;

import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.moyora.clubschedule.mapper.UserMapper;
import com.moyora.clubschedule.util.TestAuthUtil;
import com.moyora.clubschedule.vo.UserVo;

import lombok.RequiredArgsConstructor;

/**
 * 테스트 계정 로그인. test.auth.secret 이 설정된 경우에만 동작한다.
 * 운영 환경에서는 test.auth.secret 을 비워두어 모든 요청이 503을 반환하도록 한다.
 */
@RestController
@RequestMapping("/login/test")
@RequiredArgsConstructor
public class TestLoginController {

    private final TestAuthUtil testAuthUtil;
    private final UserMapper   userMapper;

    /** 수동 로그인용 UI 페이지 (Thymeleaf 없이 HTML 직접 반환) */
    @GetMapping(produces = MediaType.TEXT_HTML_VALUE)
    public ResponseEntity<String> testLoginPage() {
        if (!testAuthUtil.isEnabled()) {
            return ResponseEntity.status(503)
                    .contentType(MediaType.TEXT_HTML)
                    .body("<html><body><h2>테스트 인증이 비활성화되어 있습니다.</h2>"
                            + "<p>application-private.properties 에 test_auth_secret 을 설정하세요.</p></body></html>");
        }
        return ResponseEntity.ok()
                .contentType(MediaType.TEXT_HTML)
                .body(LOGIN_PAGE_HTML);
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

    // ── 로그인 UI HTML ─────────────────────────────────────────────────────────

    private static final String LOGIN_PAGE_HTML =
        "<!DOCTYPE html><html lang=\"ko\"><head><meta charset=\"UTF-8\">" +
        "<title>테스트 로그인</title>" +
        "<style>" +
        "body{font-family:sans-serif;display:flex;justify-content:center;align-items:center;" +
            "min-height:100vh;margin:0;background:#f1f5f9;}" +
        ".card{background:#fff;border-radius:12px;padding:32px 40px;" +
            "box-shadow:0 4px 20px rgba(0,0,0,.08);width:320px;}" +
        "h1{font-size:18px;margin:0 0 8px;color:#1e293b;}" +
        "p{font-size:13px;color:#64748b;margin:0 0 24px;}" +
        "label{font-size:13px;font-weight:600;color:#475569;display:block;margin-bottom:6px;}" +
        "select,input{width:100%;box-sizing:border-box;padding:9px 12px;" +
            "border:1px solid #e2e8f0;border-radius:8px;font-size:14px;color:#1e293b;margin-bottom:16px;}" +
        "button{width:100%;padding:10px;background:#3b82f6;color:#fff;border:none;" +
            "border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;}" +
        "button:hover{background:#2563eb;}" +
        ".msg{margin-top:12px;font-size:13px;text-align:center;padding:8px;border-radius:6px;display:none;}" +
        ".msg.error{background:#fee2e2;color:#991b1b;}" +
        ".msg.ok{background:#dcfce7;color:#166534;}" +
        "</style></head><body>" +
        "<div class=\"card\">" +
        "<h1>테스트 로그인</h1>" +
        "<p>개발 환경 전용. 운영 서버에서는 동작하지 않습니다.</p>" +
        "<label for=\"sel\">테스트 계정 선택</label>" +
        "<select id=\"sel\"></select>" +
        "<label for=\"custom\">직접 입력 (test01 형식)</label>" +
        "<input id=\"custom\" type=\"text\" placeholder=\"test01\">" +
        "<button onclick=\"doLogin()\">로그인</button>" +
        "<div class=\"msg\" id=\"msg\"></div>" +
        "</div>" +
        "<script>" +
        "var sel=document.getElementById('sel');" +
        "var opt=document.createElement('option');opt.value='';opt.textContent='-- 계정 선택 --';sel.appendChild(opt);" +
        "for(var i=1;i<=100;i++){" +
            "var n='test'+(i<10?'0':'')+i;" +
            "var o=document.createElement('option');o.value=n;o.textContent=n;sel.appendChild(o);}" +
        "async function doLogin(){" +
            "var username=(document.getElementById('custom').value.trim()||sel.value).trim();" +
            "if(!username){showMsg('계정을 선택하거나 입력해주세요.','error');return;}" +
            "try{" +
                "var r=await fetch('/login/test',{method:'POST'," +
                    "headers:{'Content-Type':'application/json'}," +
                    "body:JSON.stringify({username:username})});" +
                "var j=await r.json();" +
                "if(r.ok){showMsg(j.nickname+'('+j.userKey+') 로그인 완료. 이동 중…','ok');" +
                    "setTimeout(function(){location.href='/';},600);}" +
                "else{showMsg(j.message||'로그인 실패','error');}" +
            "}catch(e){showMsg(e.message,'error');}" +
        "}" +
        "function showMsg(m,t){" +
            "var el=document.getElementById('msg');el.textContent=m;" +
            "el.className='msg '+t;el.style.display='block';}" +
        "document.getElementById('custom').addEventListener('keydown'," +
            "function(e){if(e.key==='Enter')doLogin();});" +
        "</script></body></html>";
}

package com.moyora.clubschedule.controller;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

import com.moyora.clubschedule.security.CustomUserDetails;
import com.moyora.clubschedule.util.KakaoTokenUtil;
import com.moyora.clubschedule.service.UserService;
import com.moyora.clubschedule.vo.UserVo;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;

import lombok.RequiredArgsConstructor;

@Controller
@RequiredArgsConstructor
public class MainController {

    private final KakaoTokenUtil kakaoTokenUtil;
    private final UserService userService;

    @GetMapping("/")
    public String main(@AuthenticationPrincipal CustomUserDetails userDetails, Model model, HttpServletRequest request) {
        if (userDetails != null) {
            model.addAttribute("userKey", userDetails.getUserKey());
            model.addAttribute("roles", userDetails.getAuthorities());
            boolean isAdmin = userDetails.getAuthorities().stream()
                    .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
            model.addAttribute("isAdmin", isAdmin);
            return "main";
        }

        // Fallback: try to read AUTH_TOKEN cookie and validate it so server-side rendering can show account info
        Cookie[] cookies = request.getCookies();
        if (cookies != null) {
            for (Cookie c : cookies) {
                if ("AUTH_TOKEN".equals(c.getName())) {
                    String token = c.getValue();
                    try {
                        // 쿠키 값이 URL-encoded 되어있을 수 있으므로 디코드 시도
                        if (token.indexOf('%') >= 0 || token.indexOf('+') >= 0) {
                            token = java.net.URLDecoder.decode(token, java.nio.charset.StandardCharsets.UTF_8.name());
                        }
                    } catch (Exception ex) {
                        // 무시하고 raw 사용
                    }
                    Long kakaoApiId = kakaoTokenUtil.validateAndGetUserId(token);
                    if (kakaoApiId != null) {
                        // Map kakaoApiId to internal userKey
                        Long userKey = userService.findUserKeyByKakaoApiId(kakaoApiId);
                        if (userKey != null) {
                            UserVo uv = userService.getUserByUserKey(userKey);
                            model.addAttribute("userKey", userKey);
                            java.util.List<org.springframework.security.core.authority.SimpleGrantedAuthority> auths = new java.util.ArrayList<>();
                            if (uv != null && "ADMIN".equalsIgnoreCase(uv.getSystemRole())) {
                                auths.add(new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_ADMIN"));
                            }
                            auths.add(new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_USER"));
                            model.addAttribute("roles", auths);
                            model.addAttribute("isAdmin", auths.stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN")));
                            model.addAttribute("_auth_source", "cookie");
                        }
                    }
                    break;
                }
            }
        }

        return "main";
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/admin")
    public String admin(@AuthenticationPrincipal CustomUserDetails userDetails, Model model) {
        if (userDetails != null) {
            model.addAttribute("userKey", userDetails.getUserKey());
            model.addAttribute("roles", userDetails.getAuthorities());
            boolean isAdmin = userDetails.getAuthorities().stream()
                    .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
            model.addAttribute("isAdmin", isAdmin);
        }
        return "admin";
    }
}
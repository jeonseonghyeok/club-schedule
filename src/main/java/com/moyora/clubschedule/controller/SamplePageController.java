package com.moyora.clubschedule.controller;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;


@Controller
@RequestMapping("/sample")
public class SamplePageController {
	/**
     * 회원가입 페이지
     * @return 뷰 이름 "signUp"
     */
    @GetMapping("/sign")
    public String sign(Model model) {
        return "sign";
    }
    
    /**
     * 자동로그인 페이지(회원가입 포함)
     * @return 뷰 이름 "signUp"
     */
    @GetMapping("/sign/login-callback")
    public String signAuto(Model model) {
        return "login_callback";
    }
    
    /**
     * 메인 페이지
     * @return 뷰 이름 "main"
     */
    @GetMapping("/main")
    public String main(Model model) {
        return "main";
    }
}
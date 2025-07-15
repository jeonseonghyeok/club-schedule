package com.moyora.clubschedule.controller;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;


@Controller
@RequestMapping("/sample/")
public class SamplePageController {
	/**
     * 회원가입 페이지
     * @return 뷰 이름 "signUp"
     */
    @GetMapping("/sign")
    public String sign(Model model) {
        return "sign";
    }
}
package com.moyora.clubschedule.vo;

import lombok.Data;

@Data
public class UserCreateVo {
    private Long kakaoApiId;           // kakao_api_id
    private String nickname;
    private String referrerUrl;

    public UserCreateVo(Long kakaoApiId, String nickname, String referrerUrl) {
        this.kakaoApiId = kakaoApiId;
        this.nickname = nickname;
        this.referrerUrl = referrerUrl;
    }
}
package com.moyora.clubschedule.vo;

import java.util.Date;
import lombok.Data;

@Data
public class UserVo {
    private Long userKey;
    private Long kakaoApiId;
    private String nickname;
    private Date createdAt;
    private String referrerUrl;
}

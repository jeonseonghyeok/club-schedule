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
    private String systemRole; // DB의 system_role 컬럼 매핑 (USER, ADMIN)
}
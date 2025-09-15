package com.moyora.clubschedule.service;

import org.springframework.stereotype.Service;

import com.moyora.clubschedule.mapper.UserMapper;

@Service
public class UserService {
    
    private final UserMapper userMapper; // 마이바티스 매퍼 의존성 주입

    public UserService(UserMapper userMapper) {
        this.userMapper = userMapper;
    }

    public Long findUserKeyByKakaoApiId(Long kakaoApiId) {
        // 마이바티스 매퍼를 통해 DB 쿼리를 호출합니다.
        // 마이바티스 Mapper가 DB에서 kakaoApiId에 해당하는 userKey를 찾아줍니다.
        return userMapper.findUserKeyByKakaoApiId(kakaoApiId);
    }
}
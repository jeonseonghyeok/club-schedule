package com.moyora.clubschedule.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.moyora.clubschedule.mapper.UserMapper;
import com.moyora.clubschedule.mapper.CommonPagingExamplesMapper;
import com.moyora.clubschedule.vo.UserVo;

@Service
public class UserService {
    
    private final UserMapper userMapper; // 마이바티스 매퍼 의존성 주입
    private final CommonPagingExamplesMapper pagingMapper;

    public UserService(UserMapper userMapper, CommonPagingExamplesMapper pagingMapper) {
        this.userMapper = userMapper;
        this.pagingMapper = pagingMapper;
    }

    public Long findUserKeyByKakaoApiId(Long kakaoApiId) {
        // 마이바티스 매퍼를 통해 DB 쿼리를 호출합니다.
        // 마이바티스 Mapper가 DB에서 kakaoApiId에 해당하는 userKey를 찾아줍니다.
        return userMapper.findUserKeyByKakaoApiId(kakaoApiId);
    }

    public UserVo getUserByKakaoApiId(Long kakaoApiId) {
        return userMapper.selectByKakaoApiId(kakaoApiId);
    }

    public UserVo getUserByUserKey(Long userKey) {
        return userMapper.selectByUserKey(userKey);
    }

    public List<UserVo> listAllUsers() {
        return userMapper.selectAllOrderByUserKeyDesc();
    }

    // New: paged users using LIMIT/OFFSET
    public List<UserVo> findUsersPaged(String q, int page, int size){
        int pg = Math.max(1, page);
        int sz = Math.max(1, size);
        int offset = (pg - 1) * sz;
        return pagingMapper.selectUsersPaged(q, sz, offset);
    }

    public int countUsersFiltered(String q){
        return pagingMapper.countUsersFiltered(q);
    }
}
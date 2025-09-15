package com.moyora.clubschedule.mapper;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import com.moyora.clubschedule.vo.UserCreateVo;
import com.moyora.clubschedule.vo.UserVo;

@Mapper
public interface UserMapper {
	UserVo selectByKakaoApiId(Long kakaoApiId);
	int insertKakaoUserInfo(UserCreateVo userCreateVo);
	// kakaoApiId를 매개변수로 받아 userKey를 반환하는 메서드
    Long findUserKeyByKakaoApiId(@Param("kakaoApiId") Long kakaoApiId);
}

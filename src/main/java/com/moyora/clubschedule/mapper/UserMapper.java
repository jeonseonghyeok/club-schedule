package com.moyora.clubschedule.mapper;

import org.apache.ibatis.annotations.Mapper;

import com.moyora.clubschedule.vo.UserCreateVo;
import com.moyora.clubschedule.vo.UserVo;

@Mapper
public interface UserMapper {
	UserVo selectByKakaoApiId(Long kakaoApiId);
	int insertKakaoUserInfo(UserCreateVo userCreateVo);
}

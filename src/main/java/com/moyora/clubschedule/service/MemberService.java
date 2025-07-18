package com.moyora.clubschedule.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.moyora.clubschedule.mapper.MemberMapper;
import com.moyora.clubschedule.util.KakaoTokenUtil;

@Service
public class MemberService {
	@Autowired
	private KakaoTokenUtil kakaoTokenUtil;
	@Autowired
	private MemberMapper memberMapper;
	
	public boolean autoSignUpByKakaoApi(String accessToken) {
		Long userId = kakaoTokenUtil.validateAndGetUserId(accessToken);
		if(userId == null)
			return false;
		else {
			memberMapper.insert(userId);
		}
		return true;
	}
}

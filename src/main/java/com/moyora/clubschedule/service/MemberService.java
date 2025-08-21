package com.moyora.clubschedule.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.moyora.clubschedule.mapper.UserMapper;
import com.moyora.clubschedule.util.KakaoTokenUtil;
import com.moyora.clubschedule.vo.UserCreateVo;

@Service
public class MemberService {
	@Autowired
	private KakaoTokenUtil kakaoTokenUtil;
	@Autowired
	private UserMapper userMapper;
	
	@Transactional
	public void autoSignUpByKakaoApi(String accessToken, String referern) {
	    UserCreateVo userCreateVo = kakaoTokenUtil.validateAndGetUserInfo(accessToken,referern);

	    // 이미 가입된 사용자라면 종료
	    if (userMapper.selectByKakaoApiId(userCreateVo.getKakaoApiId()) != null) {
	        return;
	    }

	    // 신규 사용자 삽입 시도
	    int inserted = userMapper.insertKakaoUserInfo(userCreateVo);

	    if (inserted == 0) {
	        // 중복 또는 기타 이유로 삽입되지 않았을 경우 예외 처리
	        throw new IllegalStateException("회원 자동가입 실패: kakao_api_id 중복 또는 DB 오류");
	    }
	}
}

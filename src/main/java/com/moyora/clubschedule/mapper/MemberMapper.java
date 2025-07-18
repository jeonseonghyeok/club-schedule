package com.moyora.clubschedule.mapper;

import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface MemberMapper {
	void insert(Long memberKakaoId);
}

package com.moyora.clubschedule.util;

import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.RestTemplate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;

import java.util.*;

@Component
public class KakaoTokenUtil {

	@Value("${kakao.rest.key}")
    private String restKey;

    @Value("${kakao.token.issue.url}")
    private String tokenIssueURL;

    @Value("${kakao.redirect-whitelist}")
    private String redirectWhitelistRaw;
    
    @Value("${kakao.client.secret.key}")
    private String clientSecretKey;
    
	public Map<String, Object> getToken(String code,String redirectUri) {
		RestTemplate restTemplate = new RestTemplate();

		HttpHeaders headers = new HttpHeaders();
		headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

		MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
		params.add("grant_type", "authorization_code");
		params.add("client_id", restKey);
		params.add("redirect_uri", redirectUri);
		params.add("code", code);
		params.add("client_secret", clientSecretKey);

		HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(params, headers);

		try {
		    ResponseEntity<Map> response = restTemplate.postForEntity(tokenIssueURL, request, Map.class);
		    if (response.getStatusCode() == HttpStatus.OK) {
		        return response.getBody();
		    } else {
		        throw new RuntimeException("카카오 토큰 요청 실패: " + response.getStatusCode());
		    }
		} catch (HttpClientErrorException e) {
		    // 400, 401, 403, 404 등 클라이언트 에러
		    String responseBody = e.getResponseBodyAsString();
		    throw new RuntimeException("카카오 토큰 요청 실패(클라이언트 오류): " + e.getStatusCode() + "\n응답 내용: " + responseBody, e);
		} catch (HttpServerErrorException e) {
		    // 500번대 서버 에러
		    throw new RuntimeException("카카오 토큰 요청 실패(서버 오류): " + e.getStatusCode(), e);
		}
	}

	// 토큰의 유효성 검증
	public boolean validateToken(String token) {
		RestTemplate restTemplate = new RestTemplate();
		HttpHeaders headers = new HttpHeaders();
		headers.set("Authorization", "Bearer " + token);

		HttpEntity<String> entity = new HttpEntity<>(headers);

		try {
			ResponseEntity<Map> response = restTemplate.exchange("https://kapi.kakao.com/v1/user/access_token_info",
					HttpMethod.GET, entity, Map.class);
			return response.getStatusCode().is2xxSuccessful(); // 유효하면 true
		} catch (HttpClientErrorException.Unauthorized e) {
			return false; // 만료/무효
		}
	}

	// Authentication(인증) 객체 반환 - Spring Security 연동용
	public Authentication getAuthentication(Long userId) {
		// 스프링 시큐리티의 기본 UserDetails 객체 활용 (username = userId)
		User user = new User(String.valueOf(userId), // username
				"", // password 없음 (소셜로그인)
				Collections.singletonList(new SimpleGrantedAuthority("ROLE_USER")));
		// password와 principal은 null/""로 두고, 권한은 필요에 따라 조정
		return new UsernamePasswordAuthenticationToken(user, null, user.getAuthorities());
	}

	//accessToken을 검증하고 id 정보를 가져온다.
	public Long validateAndGetUserId(String accessToken) {
		RestTemplate restTemplate = new RestTemplate();
		HttpHeaders headers = new HttpHeaders();
		headers.set("Authorization", "Bearer " + accessToken);
		HttpEntity<String> entity = new HttpEntity<>(headers);

		try {
			ResponseEntity<Map> response = restTemplate.exchange("https://kapi.kakao.com/v1/user/access_token_info",
					HttpMethod.GET, entity, Map.class);
			if (response.getStatusCode().is2xxSuccessful()) {
				// 유효하면 user_id 반환
				Map<String, Object> body = response.getBody();
				Number id = (Number) body.get("id");
				return id != null ? id.longValue() : null;
			}
		} catch (Exception e) {
			// 401 등 발생시 null 반환
			return null;
		}
		return null;
	}
	
	public List<String> getRedirectWhitelist() {
		return Arrays.stream(redirectWhitelistRaw.split(",")).map(String::trim).toList();
	}
}

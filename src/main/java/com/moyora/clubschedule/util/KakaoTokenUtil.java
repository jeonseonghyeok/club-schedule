package com.moyora.clubschedule.util;

import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.RestTemplate;

import com.moyora.clubschedule.security.CustomUserDetails;
import com.moyora.clubschedule.vo.UserCreateVo;
import com.moyora.clubschedule.vo.UserVo;
import com.moyora.clubschedule.service.UserService;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import com.nimbusds.jose.jwk.source.JWKSource;
import com.nimbusds.jose.jwk.source.RemoteJWKSet;
import com.nimbusds.jose.proc.JWSVerificationKeySelector;
import com.nimbusds.jose.proc.SecurityContext;
import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jwt.proc.DefaultJWTProcessor;

import jakarta.annotation.PostConstruct;

import com.nimbusds.jwt.JWTClaimsSet;
import java.net.URL;
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

    private DefaultJWTProcessor<SecurityContext> jwtProcessor;

    private final UserService userService;

    public KakaoTokenUtil(UserService userService) {
        this.userService = userService;
    }
    
    // 서버 시작 시 한 번만 실행하여 공개키 캐시 구성
    @PostConstruct
    public void init() throws Exception {
        URL jwkSetURL = new URL("https://kauth.kakao.com/.well-known/jwks.json");
        JWKSource<SecurityContext> keySource = new RemoteJWKSet<>(jwkSetURL);
        JWSVerificationKeySelector<SecurityContext> keySelector = 
            new JWSVerificationKeySelector<>(JWSAlgorithm.RS256, keySource);
        
        this.jwtProcessor = new DefaultJWTProcessor<>();
        this.jwtProcessor.setJWSKeySelector(keySelector);
    }
    
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
	/*
	 * public boolean validateToken(String token) { RestTemplate restTemplate = new
	 * RestTemplate(); HttpHeaders headers = new HttpHeaders();
	 * headers.set("Authorization", "Bearer " + token);
	 * 
	 * HttpEntity<String> entity = new HttpEntity<>(headers);
	 * 
	 * try { ResponseEntity<Map> response =
	 * restTemplate.exchange("https://kapi.kakao.com/v1/user/access_token_info",
	 * HttpMethod.GET, entity, Map.class); return
	 * response.getStatusCode().is2xxSuccessful(); // 유효하면 true } catch
	 * (HttpClientErrorException.Unauthorized e) { return false; // 만료/무효 } }
	 */

	// Authentication(인증) 객체 반환 - Spring Security 연동용
	public Authentication getAuthentication(Long kakaoApiId) {
        // Look up internal userKey from DB using kakaoApiId
        Long userKey = null;
        try {
            userKey = userService.findUserKeyByKakaoApiId(kakaoApiId);
        } catch (Exception e) {
            // If lookup fails, log and return null (no authentication)
            return null;
        }
        if (userKey == null) {
            // No linked user account found -> authentication should fail (user not signed up yet)
            return null;
        }

        // Load user details from DB to get system role
        com.moyora.clubschedule.vo.UserVo userVo = null;
        try {
            userVo = userService.getUserByUserKey(userKey);
        } catch (Exception e) {
            return null;
        }
        if (userVo == null) return null;

        // determine roles
        java.util.List<org.springframework.security.core.authority.SimpleGrantedAuthority> auths = new java.util.ArrayList<>();
        if ("ADMIN".equalsIgnoreCase(userVo.getSystemRole())) {
            auths.add(new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_ADMIN"));
        }
        // default role
        auths.add(new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_USER"));

        // Create CustomUserDetails with internal userKey and authorities
        CustomUserDetails userDetails = new CustomUserDetails(userKey, auths);

        return new UsernamePasswordAuthenticationToken(
            userDetails,
            null,
            userDetails.getAuthorities()
        );
    }

	//accessToken을 검증하고 id 정보를 가져온다.
	public Long validateAndGetUserId(String idToken) {
		try {
            // 카카오 서버 통신 없이 메모리상의 공개키로 서명 검증 및 페이로드 추출
            JWTClaimsSet claimsSet = jwtProcessor.process(idToken, null);
            return Long.parseLong(claimsSet.getSubject());
        } catch (Exception e) {
            // 서명 불일치, 만료 등 검증 실패 시
            return null;
        }
	}
	
	public UserCreateVo validateAndGetUserInfo(String accessToken, String referern) {
		RestTemplate restTemplate = new RestTemplate();
		HttpHeaders headers = new HttpHeaders();
		headers.set("Authorization", "Bearer " + accessToken);
		HttpEntity<String> entity = new HttpEntity<>(headers);

		try {
			// 카카오 사용자 정보 요청
			ResponseEntity<Map> response = restTemplate.exchange("https://kapi.kakao.com/v2/user/me", HttpMethod.GET,
					entity, Map.class);

			if (response.getStatusCode().is2xxSuccessful()) {
				Map<String, Object> body = response.getBody();
				if (body == null)
					return null;

				// id 추출
				Long id = ((Number) body.get("id")).longValue();

				Map<String, Object> properties = (Map<String, Object>) body.get("properties");
				String nickname = properties != null ? (String) properties.get("nickname") : null;

				return new UserCreateVo(id, nickname, referern);
			}
		} catch (Exception e) {
			throw new RuntimeException("카카오 사용자 정보 요청 중 예외 발생", e);
		}

		return null;
	}

	public List<String> getRedirectWhitelist() {
		return Arrays.stream(redirectWhitelistRaw.split(",")).map(String::trim).toList();
	}
}
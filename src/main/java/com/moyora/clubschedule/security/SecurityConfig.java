package com.moyora.clubschedule.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.csrf.CsrfTokenRequestAttributeHandler;

import com.moyora.clubschedule.util.KakaoTokenUtil;

import lombok.AllArgsConstructor;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true)
@AllArgsConstructor
public class SecurityConfig {

	private final KakaoTokenUtil kakaoTokenUtil;
	
	@Bean
	public JwtAuthenticationFilter jwtAuthenticationFilter() {
		return new JwtAuthenticationFilter(kakaoTokenUtil);
	}

	@Bean
	SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
		// AUTH_TOKEN은 httpOnly 유지. CSRF는 별도 쿠키 XSRF-TOKEN(httpOnly=false) + 헤더 X-XSRF-TOKEN 조합.
		HeaderOrCookieCsrfTokenRepository tokenRepository = new HeaderOrCookieCsrfTokenRepository();
		
		CsrfTokenRequestAttributeHandler requestHandler = new CsrfTokenRequestAttributeHandler();
		requestHandler.setCsrfRequestAttributeName("_csrf");

		return http
				/*
				 * .csrf(csrf -> csrf .csrfTokenRepository(tokenRepository)
				 * .csrfTokenRequestHandler(requestHandler)
				 * .ignoringRequestMatchers("/login/**")) //최초 진입 시 토큰이 없으므로 검증 대상에서 제외
				 */
				.csrf(csrf -> csrf.disable())//CSRF 비활성화
				.sessionManagement(sess -> sess.sessionCreationPolicy(SessionCreationPolicy.STATELESS))//서버가 자체적인 HttpSession을 메모리에 절대 생성하지 않고 상태를 유지하지 않음을 명시
				.formLogin(form -> form.disable())//폼 로그인 비활성화
				.httpBasic(httpBasic -> httpBasic.disable())//
				.authorizeHttpRequests(auth -> auth
						.requestMatchers(WhitelistConfig.AUTH_WHITELIST).permitAll()
						.anyRequest().authenticated()
				)
				.addFilterBefore(jwtAuthenticationFilter(), UsernamePasswordAuthenticationFilter.class)
				.build();
	}
}
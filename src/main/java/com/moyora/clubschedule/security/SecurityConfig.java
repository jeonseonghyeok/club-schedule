package com.moyora.clubschedule.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import com.moyora.clubschedule.service.UserService;
import com.moyora.clubschedule.util.KakaoTokenUtil;

import lombok.AllArgsConstructor;

@Configuration
@EnableWebSecurity
@AllArgsConstructor
public class SecurityConfig {

	private final KakaoTokenUtil kakaoTokenUtil;
	private final UserService userService; 
	
	@Bean
	public JwtAuthenticationFilter jwtAuthenticationFilter() {
		return new JwtAuthenticationFilter(kakaoTokenUtil,userService);
	}

	@Bean
	SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
		return http.csrf(csrf -> csrf.disable())
				.sessionManagement(sess -> sess.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
				.formLogin(form -> form.disable())
				.httpBasic(httpBasic -> httpBasic.disable())
				.authorizeHttpRequests(auth -> auth
						.requestMatchers(HttpMethod.DELETE, "/groups/request/**").permitAll() // 이 줄을 추가합니다.
						.requestMatchers(WhitelistConfig.AUTH_WHITELIST).permitAll()
						.anyRequest().authenticated()
				)
				// UsernamePasswordAuthenticationFilter 앞에 JWT 필터 삽입
				.addFilterBefore(jwtAuthenticationFilter(), UsernamePasswordAuthenticationFilter.class).build();
	}
}
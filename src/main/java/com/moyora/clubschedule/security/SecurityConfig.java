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
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;
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
		// Spring Security 6 기본 XOR 핸들러는 쿠키 값을 그대로 헤더에 넣는 방식과 맞지 않아, raw 토큰 핸들러 사용.
		CookieCsrfTokenRepository tokenRepository = CookieCsrfTokenRepository.withHttpOnlyFalse();
		tokenRepository.setCookiePath("/");

		CsrfTokenRequestAttributeHandler requestHandler = new CsrfTokenRequestAttributeHandler();
		requestHandler.setCsrfRequestAttributeName("_csrf");

		return http
				.csrf(csrf -> csrf
						.csrfTokenRepository(tokenRepository)
						.csrfTokenRequestHandler(requestHandler)
						.ignoringRequestMatchers("/login/**"))
				.sessionManagement(sess -> sess.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
				.formLogin(form -> form.disable())
				.httpBasic(httpBasic -> httpBasic.disable())
				.authorizeHttpRequests(auth -> auth
						.requestMatchers(HttpMethod.DELETE, "/groups/request/**").permitAll()
						.requestMatchers(WhitelistConfig.AUTH_WHITELIST).permitAll()
						.anyRequest().authenticated()
				)
				.addFilterBefore(jwtAuthenticationFilter(), UsernamePasswordAuthenticationFilter.class).build();
	}
}
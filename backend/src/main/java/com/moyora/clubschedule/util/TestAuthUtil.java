package com.moyora.clubschedule.util;

import java.nio.charset.StandardCharsets;
import java.util.Date;

import javax.crypto.SecretKey;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;

/**
 * 테스트 환경 전용 로컬 JWT 발급/검증.
 * test.auth.secret 이 설정되지 않으면 모든 메서드가 null 을 반환하여 무효화된다.
 */
@Component
public class TestAuthUtil {

    private static final long EXPIRY_MS = 86_400_000L; // 24h
    private static final String ISSUER   = "test-auth";

    private final SecretKey key;

    public TestAuthUtil(@Value("${test.auth.secret:}") String secret) {
        if (secret == null || secret.isBlank()) {
            this.key = null;
        } else {
            byte[] bytes = secret.getBytes(StandardCharsets.UTF_8);
            // HMAC-SHA256 requires >= 32 bytes; pad if shorter
            if (bytes.length < 32) {
                byte[] padded = new byte[32];
                System.arraycopy(bytes, 0, padded, 0, bytes.length);
                bytes = padded;
            }
            this.key = Keys.hmacShaKeyFor(bytes);
        }
    }

    public boolean isEnabled() {
        return key != null;
    }

    /** 테스트 JWT 발급 (sub = userKey) */
    public String issueToken(Long userKey) {
        if (key == null) return null;
        return Jwts.builder()
                .subject(String.valueOf(userKey))
                .issuer(ISSUER)
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + EXPIRY_MS))
                .signWith(key)
                .compact();
    }

    /** 테스트 JWT 검증 → userKey, 실패 시 null */
    public Long validateToken(String token) {
        if (key == null || token == null) return null;
        try {
            Claims claims = Jwts.parser()
                    .verifyWith(key)
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();
            if (!ISSUER.equals(claims.getIssuer())) return null;
            return Long.parseLong(claims.getSubject());
        } catch (Exception e) {
            return null;
        }
    }
}

package com.moyora.clubschedule.security;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.security.web.csrf.CsrfTokenRepository;
import org.springframework.security.web.csrf.DefaultCsrfToken;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;

/**
 * A thin wrapper that will accept a CSRF token from the header (X-XSRF-TOKEN) if present,
 * otherwise falls back to a delegate CsrfTokenRepository (typically CookieCsrfTokenRepository).
 */
public class HeaderOrCookieCsrfTokenRepository implements CsrfTokenRepository {

    private final CookieCsrfTokenRepository delegate;
    private final String headerName;
    private final String parameterName;

    public HeaderOrCookieCsrfTokenRepository() {
        this.delegate = CookieCsrfTokenRepository.withHttpOnlyFalse();
        // Use standard names directly to avoid accessibility issues with internal constants
        this.headerName = "X-XSRF-TOKEN";
        this.parameterName = "_csrf";
    }

    @Override
    public CsrfToken generateToken(HttpServletRequest request) {
        return delegate.generateToken(request);
    }

    @Override
    public void saveToken(CsrfToken token, HttpServletRequest request, HttpServletResponse response) {
        delegate.saveToken(token, request, response);
    }

    @Override
    public CsrfToken loadToken(HttpServletRequest request) {
        // prefer header if provided
        String headerVal = request.getHeader(this.headerName);
        if (headerVal != null && !headerVal.isEmpty()) {
            return new DefaultCsrfToken(this.headerName, this.parameterName, headerVal);
        }
        // fallback to cookie repository
        return delegate.loadToken(request);
    }
}
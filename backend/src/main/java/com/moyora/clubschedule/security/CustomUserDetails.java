package com.moyora.clubschedule.security;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;

public class CustomUserDetails implements UserDetails {
    private final Long userKey;
    private final Collection<? extends GrantedAuthority> authorities;

    public CustomUserDetails(Long userKey, Collection<? extends GrantedAuthority> authorities) {
        this.userKey = userKey;
        this.authorities = authorities;
    }

    public Long getUserKey() {
        return userKey;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return authorities;
    }

    @Override public String getPassword() { return ""; }
    @Override public String getUsername() { return String.valueOf(userKey); }
    @Override public boolean isAccountNonExpired() { return true; }
    @Override public boolean isAccountNonLocked() { return true; }
    @Override public boolean isCredentialsNonExpired() { return true; }
    @Override public boolean isEnabled() { return true; }
}
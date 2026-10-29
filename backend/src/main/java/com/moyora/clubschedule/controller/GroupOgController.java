package com.moyora.clubschedule.controller;

import java.nio.charset.StandardCharsets;

import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.moyora.clubschedule.service.GroupService;
import com.moyora.clubschedule.vo.GroupVo;

import lombok.RequiredArgsConstructor;

/**
 * 링크 미리보기(Open Graph) 태그 조각. 웹(nginx)이 /g/{id}/ · /groups/{id} 의 index.html 을 보낼 때
 * SSI 로 이 응답을 <head> 에 끼워 넣는다 — 카카오톡 등 미리보기 수집기는 스크립트를 실행하지 않기 때문.
 * 모임이 없으면 빈 응답(기본 제목·설명이 쓰인다).
 */
@RestController
@RequiredArgsConstructor
public class GroupOgController {

    private static final String SITE_NAME = "모요라";
    private static final int DESCRIPTION_MAX = 100;
    private static final MediaType HTML_UTF8 = new MediaType(MediaType.TEXT_HTML, StandardCharsets.UTF_8);

    private final GroupService groupService;

    /** app=true 면 모임 전용 앱(/g/{id}/) 기준 — 앱 이름·아이콘을 쓴다(꺼진 모임은 일반 모임 화면 기준) */
    @GetMapping("/api/groups/{groupId}/og")
    public ResponseEntity<String> og(
            @PathVariable Long groupId,
            @RequestParam(required = false, defaultValue = "false") boolean app,
            @RequestHeader(value = "X-Forwarded-Host", required = false) String forwardedHost,
            @RequestHeader(value = "X-Forwarded-Proto", required = false) String forwardedProto) {
        GroupVo group = groupService.findById(groupId);
        if (group == null) return ResponseEntity.ok().contentType(HTML_UTF8).body("");

        boolean isApp = app && Boolean.TRUE.equals(group.getAppEnabled());
        String origin = (forwardedProto != null ? forwardedProto : "https") + "://"
                + (forwardedHost != null ? forwardedHost : "");
        String name = group.getName() != null ? group.getName() : "모임";
        String title = isApp && group.getAppName() != null ? group.getAppName() : name;
        String description = group.getDescription() != null && !group.getDescription().isBlank()
                ? truncate(group.getDescription().strip().replaceAll("\\s+", " "), DESCRIPTION_MAX)
                : name + " 모임의 일정과 소식을 확인하세요.";
        String path = isApp ? "/g/" + groupId + "/" : "/groups/" + groupId;
        String image = isApp ? "/api/groups/" + groupId + "/app-icon.png" : "/icons/icon-512.png";

        String html = meta("og:type", "website")
                + meta("og:site_name", isApp ? title : SITE_NAME)
                + meta("og:title", title)
                + meta("og:description", description)
                + meta("og:url", origin + path)
                + meta("og:image", origin + image)
                + "<meta name=\"twitter:card\" content=\"summary\" />\n";
        return ResponseEntity.ok()
                .contentType(HTML_UTF8)
                .cacheControl(CacheControl.noCache())
                .body(html);
    }

    private static String meta(String property, String content) {
        return "<meta property=\"" + property + "\" content=\"" + escape(content) + "\" />\n";
    }

    private static String truncate(String text, int max) {
        return text.length() <= max ? text : text.substring(0, max - 1) + "…";
    }

    private static String escape(String text) {
        return text.replace("&", "&amp;").replace("\"", "&quot;").replace("<", "&lt;").replace(">", "&gt;");
    }
}

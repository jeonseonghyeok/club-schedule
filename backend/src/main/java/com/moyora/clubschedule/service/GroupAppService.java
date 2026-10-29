package com.moyora.clubschedule.service;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.moyora.clubschedule.mapper.GroupAppMapper;
import com.moyora.clubschedule.mapper.GroupMapper;
import com.moyora.clubschedule.vo.GroupVo;

import lombok.RequiredArgsConstructor;

/**
 * 모임 전용 앱(모임별 PWA). 주소는 /g/{groupId}/ 이고, 그 범위(scope)로 따로 설치된다.
 * 아이콘은 화면이 그려서 PNG(base64)로 올린다 — 서버에 한글 글꼴·파일 저장소를 두지 않기 위함.
 */
@Service
@RequiredArgsConstructor
public class GroupAppService {

    public static final int APP_NAME_MAX = 30;
    /** 홈 화면 아이콘 아래에 잘리지 않고 보이는 길이 */
    public static final int APP_SHORT_NAME_MAX = 12;
    /** 512px 단색 아이콘이면 수십 KB — 넉넉히 잡되 큰 파일은 막는다 */
    private static final int ICON_MAX_BYTES = 300 * 1024;
    private static final byte[] PNG_SIGNATURE = {(byte) 0x89, 'P', 'N', 'G', '\r', '\n', 0x1A, '\n'};
    private static final Pattern THEME_COLOR = Pattern.compile("^#[0-9a-fA-F]{6}$");
    public static final String DEFAULT_THEME_COLOR = "#1b5a46";
    private static final String BACKGROUND_COLOR = "#f7f8f6";

    private final GroupMapper groupMapper;
    private final GroupAppMapper groupAppMapper;

    /** 시스템 관리자: 켜기/끄기. 켤 때 아이콘(PNG base64)을 함께 받으면 저장한다 */
    @Transactional
    public boolean setEnabled(Long groupId, boolean enabled, String iconPngBase64) {
        if (groupMapper.findById(groupId) == null) return false;
        groupAppMapper.updateEnabled(groupId, enabled);
        if (enabled && iconPngBase64 != null) groupAppMapper.upsertIcon(groupId, decodeIcon(iconPngBase64));
        return true;
    }

    /** 리더·매니저: 앱 이름·대표 색·아이콘. 전용 앱이 켜진 모임만 */
    @Transactional
    public boolean updateBranding(Long groupId, String appName, String appShortName, String themeColor,
                                  String iconPngBase64) {
        GroupVo group = groupMapper.findById(groupId);
        if (group == null) return false;
        if (!Boolean.TRUE.equals(group.getAppEnabled())) {
            throw new IllegalStateException("전용 앱이 켜진 모임만 설정할 수 있습니다. 시스템 관리자에게 요청하세요.");
        }
        String name = appName == null || appName.isBlank() ? null : appName.trim();
        if (name != null && name.length() > APP_NAME_MAX) {
            throw new IllegalArgumentException("앱 이름은 " + APP_NAME_MAX + "자까지 입력할 수 있습니다.");
        }
        String shortName = appShortName == null || appShortName.isBlank() ? null : appShortName.trim();
        if (shortName != null && shortName.length() > APP_SHORT_NAME_MAX) {
            throw new IllegalArgumentException("홈 화면 이름은 " + APP_SHORT_NAME_MAX + "자까지 입력할 수 있습니다.");
        }
        if (themeColor == null || !THEME_COLOR.matcher(themeColor).matches()) {
            throw new IllegalArgumentException("대표 색이 올바르지 않습니다.");
        }
        groupAppMapper.updateBranding(groupId, name, shortName, themeColor.toLowerCase());
        if (iconPngBase64 != null) groupAppMapper.upsertIcon(groupId, decodeIcon(iconPngBase64));
        return true;
    }

    /** 웹 앱 매니페스트 — 전용 앱이 꺼져 있으면 null */
    public Map<String, Object> buildManifest(Long groupId) {
        GroupVo group = groupMapper.findById(groupId);
        if (group == null || !Boolean.TRUE.equals(group.getAppEnabled())) return null;
        String scope = "/g/" + groupId + "/";
        String name = group.getAppName() != null ? group.getAppName() : group.getName();
        String color = group.getAppThemeColor() != null ? group.getAppThemeColor() : DEFAULT_THEME_COLOR;

        Map<String, Object> manifest = new LinkedHashMap<>();
        manifest.put("id", scope);
        manifest.put("name", name);
        manifest.put("short_name", group.getAppShortName() != null ? group.getAppShortName() : shortenForHomeScreen(name));
        manifest.put("description", group.getName() + " 모임 일정 앱");
        manifest.put("lang", "ko");
        manifest.put("start_url", scope);
        manifest.put("scope", scope);
        manifest.put("display", "standalone");
        manifest.put("orientation", "portrait");
        manifest.put("background_color", BACKGROUND_COLOR);
        manifest.put("theme_color", color);
        LocalDateTime iconUpdatedAt = groupAppMapper.selectIconUpdatedAt(groupId);
        if (iconUpdatedAt != null) {
            String src = "/api/groups/" + groupId + "/app-icon.png?v="
                    + iconUpdatedAt.atZone(ZoneId.systemDefault()).toEpochSecond();
            manifest.put("icons", List.of(
                    Map.of("src", src, "sizes", "512x512", "type", "image/png", "purpose", "any"),
                    Map.of("src", src, "sizes", "512x512", "type", "image/png", "purpose", "maskable")));
        } else {
            // 아이콘을 아직 올리지 않았으면 모요라 아이콘으로 설치된다
            manifest.put("icons", List.of(
                    Map.of("src", "/icons/icon-192.png", "sizes", "192x192", "type", "image/png"),
                    Map.of("src", "/icons/icon-512.png", "sizes", "512x512", "type", "image/png")));
        }
        return manifest;
    }

    /** 아이콘 PNG — 없거나 전용 앱이 꺼져 있으면 null */
    public byte[] getIcon(Long groupId) {
        GroupVo group = groupMapper.findById(groupId);
        if (group == null || !Boolean.TRUE.equals(group.getAppEnabled())) return null;
        com.moyora.clubschedule.vo.GroupAppIconVo icon = groupAppMapper.selectIcon(groupId);
        return icon != null ? icon.getPng() : null;
    }

    /** 짧은 이름을 정하지 않았으면 앞부분만 — 홈 화면이 임의로 자르는 것보다 낫다 */
    private static String shortenForHomeScreen(String name) {
        return name.length() <= APP_SHORT_NAME_MAX ? name : name.substring(0, APP_SHORT_NAME_MAX);
    }

    private static byte[] decodeIcon(String base64) {
        byte[] png;
        try {
            png = Base64.getDecoder().decode(base64);
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("아이콘 형식이 올바르지 않습니다.");
        }
        if (png.length > ICON_MAX_BYTES || png.length < PNG_SIGNATURE.length) {
            throw new IllegalArgumentException("아이콘 파일 크기가 올바르지 않습니다.");
        }
        for (int i = 0; i < PNG_SIGNATURE.length; i++) {
            if (png[i] != PNG_SIGNATURE[i]) throw new IllegalArgumentException("아이콘은 PNG 여야 합니다.");
        }
        return png;
    }
}

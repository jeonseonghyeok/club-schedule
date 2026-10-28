package com.moyora.clubschedule.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.moyora.clubschedule.exception.ApiErrors;
import com.moyora.clubschedule.service.PlaceSearchService;

import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
public class PlaceController {

    private static final int KEYWORD_MIN = 2;
    private static final int KEYWORD_MAX = 50;

    private final PlaceSearchService placeSearchService;

    /** 장소 키워드 검색 — [{name, address, roadAddress, latitude, longitude}]. 카카오맵 미설정 시 503 */
    @GetMapping("/api/places")
    public ResponseEntity<?> search(@RequestParam String q) {
        String keyword = q.trim();
        if (keyword.length() < KEYWORD_MIN || keyword.length() > KEYWORD_MAX) {
            return ApiErrors.badRequest("검색어는 2~50자로 입력하세요.");
        }
        try {
            return ResponseEntity.ok(placeSearchService.searchByKeyword(keyword));
        } catch (PlaceSearchService.PlaceSearchUnavailableException e) {
            return ApiErrors.of(HttpStatus.SERVICE_UNAVAILABLE, e.getMessage());
        }
    }
}

package com.moyora.clubschedule.service;

import java.net.URI;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

/**
 * 카카오 로컬 키워드 검색 프록시. REST 키는 서버에만 두고, 화면은 /api/places 로 장소를 찾는다.
 * 카카오 개발자 콘솔에서 앱의 "카카오맵" 서비스가 꺼져 있으면 카카오가 403 을 주며, 이때는
 * PlaceSearchUnavailableException 으로 "사용할 수 없음"을 알린다(화면은 장소 이름만 직접 입력하게 한다).
 */
@Service
public class PlaceSearchService {

    private static final Logger log = LoggerFactory.getLogger(PlaceSearchService.class);
    private static final String KEYWORD_SEARCH_URL = "https://dapi.kakao.com/v2/local/search/keyword.json";
    private static final int RESULT_SIZE = 10;

    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${kakao.rest.key}")
    private String restKey;

    public record Place(String name, String address, String roadAddress, double latitude, double longitude) {}

    public static class PlaceSearchUnavailableException extends RuntimeException {
        public PlaceSearchUnavailableException(String message) {
            super(message);
        }
    }

    @SuppressWarnings("unchecked")
    public List<Place> searchByKeyword(String keyword) {
        URI uri = UriComponentsBuilder.fromUriString(KEYWORD_SEARCH_URL)
                .queryParam("query", keyword)
                .queryParam("size", RESULT_SIZE)
                .encode()
                .build()
                .toUri();
        HttpHeaders headers = new HttpHeaders();
        headers.set(HttpHeaders.AUTHORIZATION, "KakaoAK " + restKey);
        try {
            ResponseEntity<Map> response = restTemplate.exchange(uri, HttpMethod.GET, new HttpEntity<>(headers), Map.class);
            List<Map<String, Object>> documents = (List<Map<String, Object>>) response.getBody().get("documents");
            List<Place> places = new ArrayList<>();
            if (documents == null) return places;
            for (Map<String, Object> doc : documents) {
                places.add(new Place(
                        String.valueOf(doc.get("place_name")),
                        String.valueOf(doc.getOrDefault("address_name", "")),
                        String.valueOf(doc.getOrDefault("road_address_name", "")),
                        Double.parseDouble(String.valueOf(doc.get("y"))),
                        Double.parseDouble(String.valueOf(doc.get("x")))));
            }
            return places;
        } catch (HttpClientErrorException e) {
            log.warn("카카오 장소 검색 거부: {} {}", e.getStatusCode(), e.getResponseBodyAsString());
            throw new PlaceSearchUnavailableException("장소 검색을 사용할 수 없습니다. 장소 이름만 입력해 주세요.");
        } catch (RestClientException | NullPointerException | NumberFormatException e) {
            log.warn("카카오 장소 검색 실패: {}", e.getMessage());
            throw new PlaceSearchUnavailableException("장소 검색에 실패했습니다. 잠시 후 다시 시도해 주세요.");
        }
    }
}

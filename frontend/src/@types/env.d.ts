interface ImportMetaEnv {
	/** 카카오 REST API 키(인가 요청 client_id) — 브라우저에 노출되는 공개 값 */
	readonly VITE_KAKAO_REST_KEY: string;
	/** 카카오맵 JavaScript 키 — 없으면 지도 대신 목록만 보여준다(도메인 제한되는 공개 키) */
	readonly VITE_KAKAO_JS_KEY?: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}

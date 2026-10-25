interface ImportMetaEnv {
	/** 카카오 REST API 키(인가 요청 client_id) — 브라우저에 노출되는 공개 값 */
	readonly VITE_KAKAO_REST_KEY: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}

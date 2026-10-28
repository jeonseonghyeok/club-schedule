/** GET /api/places 항목 — 카카오 로컬 키워드 검색 결과 */
export interface Place {
	readonly name: string;
	readonly address: string;
	readonly roadAddress: string;
	readonly latitude: number;
	readonly longitude: number;
}

/** 일정 장소·모임 활동 지역으로 고른 위치 */
export interface PickedPlace {
	readonly name: string;
	readonly latitude: number;
	readonly longitude: number;
}

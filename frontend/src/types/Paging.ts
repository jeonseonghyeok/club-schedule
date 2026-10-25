/** 백엔드 PagingResponse<T> — 페이지 번호는 1부터, 페이지 버튼은 5개 단위 블록 */
export interface Paging<T> {
	readonly totalCount: number;
	readonly currentPage: number;
	readonly size: number;
	readonly totalPages: number;
	readonly startPage: number;
	readonly endPage: number;
	readonly items: readonly T[];
}

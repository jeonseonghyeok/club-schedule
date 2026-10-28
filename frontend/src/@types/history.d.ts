import '@tanstack/history';

declare module '@tanstack/history' {
	interface HistoryState {
		/** 홈 화면의 "종료 확인용" 기록 — 뒤로가기 첫 번째를 받아 낸다(useAppBackNavigation) */
		exitGuard?: boolean;
	}
}

import { useEffect, useState } from 'react';

const SDK_ID = 'kakao-maps-sdk';

export const KAKAO_MAPS_STATUS = {
	/** JavaScript 키가 설정되지 않음 — 지도 대신 목록만 */
	UNAVAILABLE: 'unavailable',
	LOADING: 'loading',
	READY: 'ready',
	/** 스크립트 로드 실패(도메인 미등록·네트워크 등) */
	ERROR: 'error',
} as const;
export type KakaoMapsStatus = (typeof KAKAO_MAPS_STATUS)[keyof typeof KAKAO_MAPS_STATUS];

let loadPromise: Promise<void> | null = null;

/** SDK 를 한 번만 불러온다(autoload=false 로 받아 kakao.maps.load 로 초기화) */
const loadSdk = (appKey: string): Promise<void> => {
	if (loadPromise) return loadPromise;
	loadPromise = new Promise<void>((resolve, reject) => {
		const script = document.createElement('script');
		script.id = SDK_ID;
		script.async = true;
		script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${encodeURIComponent(appKey)}&autoload=false`;
		script.onload = () => {
			if (!window.kakao?.maps) {
				reject(new Error('kakao.maps 없음'));
				return;
			}
			window.kakao.maps.load(() => resolve());
		};
		script.onerror = () => reject(new Error('카카오맵 SDK 로드 실패'));
		document.head.appendChild(script);
	}).catch(error => {
		// 다음 진입 때 다시 시도할 수 있게 비운다
		loadPromise = null;
		throw error;
	});
	return loadPromise;
};

export const useKakaoMaps = (): KakaoMapsStatus => {
	const appKey = import.meta.env.VITE_KAKAO_JS_KEY;
	const [status, setStatus] = useState<KakaoMapsStatus>(() => {
		if (!appKey) return KAKAO_MAPS_STATUS.UNAVAILABLE;
		return window.kakao?.maps?.Map ? KAKAO_MAPS_STATUS.READY : KAKAO_MAPS_STATUS.LOADING;
	});

	useEffect(() => {
		if (!appKey || status !== KAKAO_MAPS_STATUS.LOADING) return;
		let isActive = true;
		loadSdk(appKey)
			.then(() => isActive && setStatus(KAKAO_MAPS_STATUS.READY))
			.catch(() => isActive && setStatus(KAKAO_MAPS_STATUS.ERROR));
		return () => {
			isActive = false;
		};
	}, [appKey, status]);

	return status;
};

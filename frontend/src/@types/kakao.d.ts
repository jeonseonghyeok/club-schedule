/** 카카오맵 JavaScript SDK 중 이 앱이 쓰는 부분만 선언한다 */
declare namespace kakao.maps {
	class LatLng {
		constructor(latitude: number, longitude: number);
	}
	class LatLngBounds {
		extend(latLng: LatLng): void;
	}
	interface MapOptions {
		center: LatLng;
		level: number;
	}
	class Map {
		constructor(container: HTMLElement, options: MapOptions);
		setBounds(bounds: LatLngBounds): void;
		setCenter(latLng: LatLng): void;
		setLevel(level: number): void;
		panTo(latLng: LatLng): void;
		relayout(): void;
	}
	interface MarkerOptions {
		position: LatLng;
		title?: string;
		map?: Map;
	}
	class Marker {
		constructor(options: MarkerOptions);
		setMap(map: Map | null): void;
		setZIndex(zIndex: number): void;
	}
	namespace event {
		function addListener(target: Marker | Map, type: string, handler: () => void): void;
	}
	function load(callback: () => void): void;
}

interface Window {
	kakao?: typeof kakao;
}

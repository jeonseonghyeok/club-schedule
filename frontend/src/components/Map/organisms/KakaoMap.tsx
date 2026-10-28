import { useEffect, useRef } from 'react';
import type { MapMarker } from '@/types/Map';

// 마커가 없을 때 보여줄 기본 위치(서울시청)와 확대 수준
const DEFAULT_CENTER = { latitude: 37.5666, longitude: 126.9784 };
const DEFAULT_LEVEL = 8;
const SINGLE_MARKER_LEVEL = 4;
const SELECTED_Z_INDEX = 10;

interface Props {
	markers: readonly MapMarker[];
	selectedId: string | null;
	onSelect: (id: string) => void;
	/** 지도 영역의 접근성 이름 */
	label: string;
}

/**
 * 카카오맵 + 마커. 마커가 바뀌면 모두 보이도록 범위를 맞추고, 선택한 마커로 이동한다.
 * SDK 가 준비된 뒤에만 렌더한다(useKakaoMaps 가 READY 일 때).
 */
export const KakaoMap = (props: Props) => {
	const { markers, selectedId, onSelect, label } = props;
	const containerRef = useRef<HTMLDivElement>(null);
	const mapRef = useRef<kakao.maps.Map | null>(null);
	const markerRefs = useRef(new Map<string, { marker: kakao.maps.Marker; position: kakao.maps.LatLng }>());
	const onSelectRef = useRef(onSelect);
	useEffect(() => {
		onSelectRef.current = onSelect;
	});

	useEffect(() => {
		const container = containerRef.current;
		if (!container || mapRef.current) return;
		mapRef.current = new kakao.maps.Map(container, {
			center: new kakao.maps.LatLng(DEFAULT_CENTER.latitude, DEFAULT_CENTER.longitude),
			level: DEFAULT_LEVEL,
		});
	}, []);

	useEffect(() => {
		const map = mapRef.current;
		if (!map) return;
		const refs = markerRefs.current;
		refs.forEach(({ marker }) => marker.setMap(null));
		refs.clear();
		if (markers.length === 0) return;

		const bounds = new kakao.maps.LatLngBounds();
		markers.forEach(item => {
			const position = new kakao.maps.LatLng(item.latitude, item.longitude);
			const marker = new kakao.maps.Marker({ position, title: item.title, map });
			kakao.maps.event.addListener(marker, 'click', () => onSelectRef.current(item.id));
			refs.set(item.id, { marker, position });
			bounds.extend(position);
		});
		if (markers.length === 1) {
			const only = refs.values().next().value;
			if (only) {
				map.setCenter(only.position);
				map.setLevel(SINGLE_MARKER_LEVEL);
			}
		} else {
			map.setBounds(bounds);
		}
	}, [markers]);

	useEffect(() => {
		if (!selectedId) return;
		const selected = markerRefs.current.get(selectedId);
		if (!selected) return;
		selected.marker.setZIndex(SELECTED_Z_INDEX);
		mapRef.current?.panTo(selected.position);
	}, [selectedId]);

	return <div ref={containerRef} role="region" aria-label={label} className="h-full w-full" />;
};

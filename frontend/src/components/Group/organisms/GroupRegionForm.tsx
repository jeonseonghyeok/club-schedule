import { useId, useState } from 'react';
import type { FormEvent } from 'react';
import { Button } from '@/components/common/atoms/Button';
import { Icon } from '@/components/common/atoms/Icon';
import { PlaceSearchPanel } from '@/components/common/organisms/PlaceSearchPanel';
import { ModalType } from '@/constants';
import { useModalStore } from '@/modules/stores/client/modal';
import { useUpdateGroupRegion } from '@/modules/stores/server/group/mutations';
import type { GroupSettings } from '@/types/GroupSettings';

// 백엔드 group.region_name VARCHAR(100)
const REGION_NAME_MAX = 100;

interface Coordinates {
	readonly latitude: number;
	readonly longitude: number;
}

const toCoordinates = (settings: GroupSettings): Coordinates | null =>
	settings.latitude !== null && settings.longitude !== null
		? { latitude: settings.latitude, longitude: settings.longitude }
		: null;

interface Props {
	groupId: number;
	settings: GroupSettings;
}

/**
 * 대표 활동 지역 — 장소 검색으로 고르면 좌표까지 저장되어 지도 탭에 보인다.
 * 이름을 직접 고치면 좌표는 비운다(이름과 위치가 어긋나지 않게).
 */
export const GroupRegionForm = (props: Props) => {
	const { groupId, settings } = props;
	const inputId = useId();
	const [name, setName] = useState(settings.regionName ?? '');
	const [coordinates, setCoordinates] = useState<Coordinates | null>(toCoordinates(settings));
	const [isSearchOpen, setIsSearchOpen] = useState(false);
	const openModal = useModalStore(state => state.actions.openModal);
	const { mutate: save, isPending } = useUpdateGroupRegion(groupId);
	const trimmed = name.trim();
	const saved = toCoordinates(settings);
	const isUnchanged =
		trimmed === (settings.regionName ?? '') &&
		coordinates?.latitude === saved?.latitude &&
		coordinates?.longitude === saved?.longitude;

	const submit = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		save(
			{
				regionName: trimmed || null,
				latitude: trimmed ? (coordinates?.latitude ?? null) : null,
				longitude: trimmed ? (coordinates?.longitude ?? null) : null,
			},
			{
				onSuccess: () =>
					openModal({
						type: ModalType.ALERT,
						message: trimmed ? '활동 지역이 저장되었습니다.' : '활동 지역을 해제했습니다.',
					}),
			},
		);
	};

	return (
		<form onSubmit={submit} className="flex flex-col gap-2">
			<label htmlFor={inputId} className="text-sm font-medium text-gray-800">
				대표 활동 지역
			</label>
			<div className="flex gap-2">
				<input
					id={inputId}
					type="text"
					value={name}
					maxLength={REGION_NAME_MAX}
					placeholder="예: 강남역"
					onChange={event => {
						setName(event.target.value);
						setCoordinates(null);
					}}
					className="min-w-0 flex-1 rounded-lg border border-gray-300 px-3 py-2 text-base focus-visible:outline-2 focus-visible:outline-brand-600 sm:text-sm"
				/>
				<Button variant="secondary" className="shrink-0" onClick={() => setIsSearchOpen(open => !open)}>
					<Icon name="search" size={16} />
					찾기
				</Button>
			</div>
			{coordinates ? (
				<p className="flex items-center gap-1 text-xs text-brand-700">
					<Icon name="pin" size={14} />
					지도 탭에 표시됩니다.
				</p>
			) : (
				<p className="text-xs text-gray-500">
					"찾기"로 장소를 고르면 지도 탭에 모임이 표시됩니다. 비우고 저장하면 해제됩니다.
				</p>
			)}
			{isSearchOpen && (
				<PlaceSearchPanel
					initialKeyword={name}
					onSelect={place => {
						setName(place.name);
						setCoordinates({ latitude: place.latitude, longitude: place.longitude });
						setIsSearchOpen(false);
					}}
					onCancel={() => setIsSearchOpen(false)}
				/>
			)}
			<div className="flex justify-end">
				<Button type="submit" disabled={isPending || isUnchanged}>
					{isPending ? '저장 중…' : '활동 지역 저장'}
				</Button>
			</div>
		</form>
	);
};

import { useId } from 'react';
import { useUpdateFavoriteGroup } from '@/modules/stores/server/group/mutations';
import type { MyGroup } from '@/types/Group';
import { getGroupName } from '@/utils/group';

const NONE = '';

interface Props {
	groups: readonly MyGroup[];
	favoriteGroupId: number | null;
}

/** 우선모임 — 앱을 열면 이 모임 화면으로 바로 간다 */
export const FavoriteGroupField = (props: Props) => {
	const { groups, favoriteGroupId } = props;
	const selectId = useId();
	const helpId = useId();
	const { mutate: update, isPending } = useUpdateFavoriteGroup();

	return (
		<div className="flex flex-col gap-1.5">
			<label htmlFor={selectId} className="text-sm font-medium text-gray-800">
				우선모임
			</label>
			<select
				id={selectId}
				value={favoriteGroupId === null ? NONE : String(favoriteGroupId)}
				disabled={isPending || groups.length === 0}
				aria-describedby={helpId}
				onChange={event => {
					const next = event.target.value === NONE ? null : Number(event.target.value);
					update({ next, current: favoriteGroupId });
				}}
				className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-base focus-visible:outline-2 focus-visible:outline-brand-600 sm:text-sm"
			>
				<option value={NONE}>지정 안 함</option>
				{groups.map(group => (
					<option key={group.groupId} value={String(group.groupId)}>
						{getGroupName(group)}
					</option>
				))}
			</select>
			<p id={helpId} className="text-xs text-gray-500">
				앱을 열면 이 모임 화면으로 바로 이동합니다.
			</p>
		</div>
	);
};

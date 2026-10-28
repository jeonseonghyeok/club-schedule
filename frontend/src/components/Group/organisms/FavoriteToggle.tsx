import { ModalType } from '@/constants';
import { useModalStore } from '@/modules/stores/client/modal';
import { FAVORITE_ACTION, useToggleGroupFavorite } from '@/modules/stores/server/group/mutations';
import type { GroupViewer } from '@/types/GroupDetail';

interface Props {
	groupId: number;
	viewer: GroupViewer;
}

/** 우선(즐겨찾기) 모임 ★ — 다른 모임이 이미 지정돼 있으면 변경을 한 번 묻는다 */
export const FavoriteToggle = (props: Props) => {
	const { groupId, viewer } = props;
	const openModal = useModalStore(state => state.actions.openModal);
	const { mutate, isPending } = useToggleGroupFavorite(groupId);
	const done = (message: string) => () => openModal({ type: ModalType.ALERT, message });

	const toggle = () => {
		if (viewer.isFavoriteGroup) {
			mutate(FAVORITE_ACTION.CLEAR, { onSuccess: done('우선모임이 해체되었습니다.') });
			return;
		}
		if (!viewer.hasFavoriteGroup) {
			mutate(FAVORITE_ACTION.SET, { onSuccess: done('우선모임으로 등록되었습니다.') });
			return;
		}
		openModal({
			type: ModalType.CONFIRM,
			message: '우선모임을 변경하시겠습니까?',
			confirmLabel: '변경',
			onConfirm: () => mutate(FAVORITE_ACTION.SET, { onSuccess: done('우선모임이 변경되었습니다.') }),
		});
	};

	return (
		<button
			type="button"
			aria-pressed={viewer.isFavoriteGroup}
			aria-label="우선모임"
			title="우선모임"
			disabled={isPending}
			onClick={toggle}
			className="flex size-10 items-center justify-center rounded-full text-2xl leading-none text-amber-500 hover:bg-amber-50 focus-visible:outline-2 focus-visible:outline-brand-600 disabled:opacity-50"
		>
			<span aria-hidden="true">{viewer.isFavoriteGroup ? '★' : '☆'}</span>
		</button>
	);
};

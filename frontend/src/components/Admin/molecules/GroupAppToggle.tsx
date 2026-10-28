import { Button } from '@/components/common/atoms/Button';
import { ModalType } from '@/constants';
import { useModalStore } from '@/modules/stores/client/modal';
import { useToggleGroupApp } from '@/modules/stores/server/admin/mutations';
import type { AdminGroup } from '@/types/Admin';
import { getGroupAppPath } from '@/utils/appIcon';
import { getGroupName } from '@/utils/group';

interface Props {
	group: AdminGroup;
}

/** 관리자 모임 목록의 "전용 앱" 칸 — 켜기/끄기와 전용 앱 주소 */
export const GroupAppToggle = (props: Props) => {
	const { group } = props;
	const openModal = useModalStore(state => state.actions.openModal);
	const { mutate: toggle, isPending } = useToggleGroupApp();
	const isEnabled = !!group.appEnabled;

	const confirm = () =>
		openModal({
			type: ModalType.CONFIRM,
			message: isEnabled
				? `${getGroupName(group)} 전용 앱을 끄시겠습니까? 이미 설치한 사람은 앱을 열 수는 있지만 새로 설치할 수 없습니다.`
				: `${getGroupName(group)} 전용 앱을 켜시겠습니까? 모임 이름 첫 글자로 기본 아이콘이 만들어집니다.`,
			confirmLabel: isEnabled ? '끄기' : '켜기',
			onConfirm: () => toggle({ group, enabled: !isEnabled }),
		});

	return (
		<span className="flex items-center gap-2 whitespace-nowrap">
			<Button
				variant={isEnabled ? 'secondary' : 'primary'}
				className="min-h-8 px-3 py-1"
				disabled={isPending}
				onClick={confirm}
			>
				{isEnabled ? '끄기' : '켜기'}
			</Button>
			{isEnabled && (
				<a
					href={getGroupAppPath(group.groupId)}
					target="_blank"
					rel="noreferrer"
					className="text-sm font-medium text-brand-700 hover:underline focus-visible:outline-2 focus-visible:outline-brand-600"
				>
					열기
				</a>
			)}
		</span>
	);
};

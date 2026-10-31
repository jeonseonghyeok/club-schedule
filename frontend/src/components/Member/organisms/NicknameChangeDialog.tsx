import { Dialog } from '@/components/common/organisms/Dialog';
import { GroupNicknameForm } from '@/components/Member/organisms/GroupNicknameForm';
import { ModalType } from '@/constants';
import { useModalStore } from '@/modules/stores/client/modal';
import type { GroupMember } from '@/types/Member';

interface Props {
	groupId: number;
	member: GroupMember;
	/** 내 이름을 바꿀 때(모임이 허용했거나 내가 모임장·매니저) — 아니면 모임장·매니저가 회원 이름을 바꾼다 */
	isSelf: boolean;
	onClose: () => void;
}

export const NicknameChangeDialog = (props: Props) => {
	const { groupId, member, isSelf, onClose } = props;
	const openModal = useModalStore(state => state.actions.openModal);

	return (
		<Dialog title="닉네임 변경" onClose={onClose}>
			<GroupNicknameForm
				groupId={groupId}
				userKey={isSelf ? undefined : member.userKey}
				groupNickname={member.groupNickname ?? member.displayName}
				onSaved={() => {
					onClose();
					openModal({ type: ModalType.ALERT, message: '닉네임이 변경되었습니다.' });
				}}
			/>
		</Dialog>
	);
};

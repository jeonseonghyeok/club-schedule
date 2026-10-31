import { useId, useState } from 'react';
import { Button } from '@/components/common/atoms/Button';
import { Dialog } from '@/components/common/organisms/Dialog';
import { ModalType } from '@/constants';
import { useModalStore } from '@/modules/stores/client/modal';
import { useChangeMemberRole } from '@/modules/stores/server/member/mutations';
import { GROUP_ROLE } from '@/types/Member';
import type { GroupMember, GroupRole } from '@/types/Member';
import { getMemberName, ROLE_LABEL } from '@/utils/member';

const ROLE_OPTIONS = [
	{ value: GROUP_ROLE.MEMBER, label: ROLE_LABEL.MEMBER },
	{ value: GROUP_ROLE.MANAGER, label: ROLE_LABEL.MANAGER },
	{ value: GROUP_ROLE.LEADER, label: '리더(승계)' },
] as const satisfies readonly { value: GroupRole; label: string }[];

const isRole = (value: string): value is GroupRole => ROLE_OPTIONS.some(option => option.value === value);

interface Props {
	groupId: number;
	member: GroupMember;
	onClose: () => void;
}

/** 리더가 회원 직책을 바꾼다 — 리더로 바꾸면 승계(본인은 매니저가 된다)라 한 번 더 묻는다 */
export const RoleChangeDialog = (props: Props) => {
	const { groupId, member, onClose } = props;
	const selectId = useId();
	const [role, setRole] = useState<GroupRole>(member.role);
	const openModal = useModalStore(state => state.actions.openModal);
	const { mutate: changeRole, isPending } = useChangeMemberRole(groupId);

	const run = () =>
		changeRole(
			{ userKey: member.userKey, role },
			{
				onSuccess: () => {
					onClose();
					openModal({
						type: ModalType.ALERT,
						message: role === GROUP_ROLE.LEADER ? '리더가 위임되었습니다.' : '직책이 변경되었습니다.',
					});
				},
			},
		);

	const submit = () => {
		if (role !== GROUP_ROLE.LEADER) {
			run();
			return;
		}
		openModal({
			type: ModalType.CONFIRM,
			message: `정말 ${getMemberName(member)}님에게 리더를 승계하시겠습니까? 승계 후 본인은 매니저로 강등됩니다.`,
			confirmLabel: '리더 승계',
			onConfirm: run,
		});
	};

	return (
		<Dialog title="직책 변경" onClose={onClose}>
			<div className="flex flex-col gap-1.5">
				<label htmlFor={selectId} className="text-sm font-medium text-gray-800">
					{getMemberName(member)}님의 직책
				</label>
				<select
					id={selectId}
					value={role}
					disabled={isPending}
					onChange={event => {
						if (isRole(event.target.value)) setRole(event.target.value);
					}}
					className="w-full rounded-md border border-gray-300 px-2 py-2 text-base sm:text-sm"
				>
					{ROLE_OPTIONS.map(option => (
						<option key={option.value} value={option.value}>
							{option.label}
						</option>
					))}
				</select>
			</div>
			<div className="mt-4 flex justify-end gap-2">
				<Button variant="secondary" onClick={onClose}>
					취소
				</Button>
				<Button disabled={isPending || role === member.role} onClick={submit}>
					{isPending ? '변경 중…' : '변경'}
				</Button>
			</div>
		</Dialog>
	);
};

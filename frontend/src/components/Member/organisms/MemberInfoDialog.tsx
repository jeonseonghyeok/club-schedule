import { useId, useState } from 'react';
import type { ReactNode } from 'react';
import { Button } from '@/components/common/atoms/Button';
import { Dialog } from '@/components/common/organisms/Dialog';
import { ModalType } from '@/constants';
import { useModalStore } from '@/modules/stores/client/modal';
import { useChangeMemberRole } from '@/modules/stores/server/member/mutations';
import { GROUP_ROLE, MEMBER_STATUS } from '@/types/Member';
import type { GroupMember, GroupRole } from '@/types/Member';
import { getMemberName, isActiveMember, ROLE_LABEL } from '@/utils/member';

const ROLE_OPTIONS = [
	{ value: GROUP_ROLE.MEMBER, label: ROLE_LABEL.MEMBER },
	{ value: GROUP_ROLE.MANAGER, label: ROLE_LABEL.MANAGER },
	{ value: GROUP_ROLE.LEADER, label: '리더(승계)' },
] as const satisfies readonly { value: GroupRole; label: string }[];

const isRole = (value: string): value is GroupRole => ROLE_OPTIONS.some(option => option.value === value);

const formatDate = (value: string | null): string => (value ? new Date(value).toLocaleDateString('ko-KR') : '-');

interface Props {
	groupId: number;
	member: GroupMember;
	/** 리더가 다른 활동 회원을 볼 때: 직책을 바꿀 수 있다(리더 승계 포함) */
	canEditRole: boolean;
	/** 매니저 이상이 활동 중인 일반회원을 볼 때: 내보낼 수 있다 */
	canKick: boolean;
	onKick: (member: GroupMember) => void;
	/** 내 정보로 열었을 때만: 모임 탈퇴 */
	onWithdraw?: () => void;
	onClose: () => void;
	/** 정보 아래에 붙는 추가 영역(내 정보: 모임 닉네임 수정) */
	children?: ReactNode;
}

export const MemberInfoDialog = (props: Props) => {
	const { groupId, member, canEditRole, canKick, onKick, onWithdraw, onClose, children } = props;
	const roleId = useId();
	const [role, setRole] = useState<GroupRole>(member.role);
	const openModal = useModalStore(state => state.actions.openModal);
	const { mutate: changeRole, isPending } = useChangeMemberRole(groupId);
	const isActive = isActiveMember(member);

	const apply = () => {
		if (role === member.role) {
			onClose();
			return;
		}
		const run = () =>
			changeRole(
				{ userKey: member.userKey, role },
				{
					onSuccess: () => {
						onClose();
						if (role === GROUP_ROLE.LEADER) openModal({ type: ModalType.ALERT, message: '리더가 위임되었습니다.' });
					},
				},
			);
		if (role !== GROUP_ROLE.LEADER) {
			run();
			return;
		}
		openModal({
			type: ModalType.CONFIRM,
			message: '정말 이 회원에게 리더를 승계하시겠습니까? 승계 후 본인은 매니저로 강등됩니다.',
			confirmLabel: '리더 승계',
			onConfirm: run,
		});
	};

	return (
		<Dialog title="회원 정보" onClose={onClose}>
			<dl className="grid grid-cols-[auto_1fr] items-center gap-x-4 gap-y-2 text-sm">
				<dt className="font-semibold text-gray-500">닉네임</dt>
				<dd>{getMemberName(member)}</dd>
				{/* 정지(탈퇴/추방)된 회원은 더 이상 직책이 없으므로 퇴장일을 대신 보여준다 */}
				{isActive && (
					<>
						<dt className="font-semibold text-gray-500">
							{canEditRole ? <label htmlFor={roleId}>직책</label> : '직책'}
						</dt>
						<dd>
							{canEditRole ? (
								<select
									id={roleId}
									value={role}
									disabled={isPending}
									onChange={event => {
										if (isRole(event.target.value)) setRole(event.target.value);
									}}
									className="w-full rounded-md border border-gray-300 px-2 py-1.5"
								>
									{ROLE_OPTIONS.map(option => (
										<option key={option.value} value={option.value}>
											{option.label}
										</option>
									))}
								</select>
							) : (
								ROLE_LABEL[member.role]
							)}
						</dd>
					</>
				)}
				<dt className="font-semibold text-gray-500">가입일</dt>
				<dd>{formatDate(member.joinedAt)}</dd>
				{!isActive && member.leftAt && (
					<>
						<dt className="font-semibold text-gray-500">
							{member.status === MEMBER_STATUS.KICKED ? '추방일' : '탈퇴일'}
						</dt>
						<dd className="font-semibold text-red-700">{formatDate(member.leftAt)}</dd>
					</>
				)}
			</dl>
			{children}
			{onWithdraw && (
				<div className="mt-4 flex justify-end border-t border-gray-100 pt-3">
					<Button variant="secondary" className="text-red-800" onClick={onWithdraw}>
						모임 탈퇴
					</Button>
				</div>
			)}
			{(canEditRole || canKick) && (
				<div className="mt-4 flex justify-between gap-2 border-t border-gray-100 pt-3">
					{canKick ? (
						<Button variant="secondary" className="text-red-800" onClick={() => onKick(member)}>
							내보내기
						</Button>
					) : (
						<span />
					)}
					{canEditRole && (
						<Button disabled={isPending} onClick={apply}>
							{isPending ? '적용 중…' : '적용'}
						</Button>
					)}
				</div>
			)}
		</Dialog>
	);
};

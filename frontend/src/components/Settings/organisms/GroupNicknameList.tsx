import { useId, useState } from 'react';
import type { FormEvent } from 'react';
import { Button } from '@/components/common/atoms/Button';
import { EmptyMessage } from '@/components/common/atoms/EmptyMessage';
import { ModalType } from '@/constants';
import { useModalStore } from '@/modules/stores/client/modal';
import { useUpdateMyNickname } from '@/modules/stores/server/member/mutations';
import type { MyGroup } from '@/types/Group';
import { getGroupName } from '@/utils/group';

// 백엔드 group_member.nickname VARCHAR(30)
const NICKNAME_MAX = 30;

interface RowProps {
	group: MyGroup;
	/** 모임이 막아둬도 리더는 바꿀 수 있다 */
	isEditable: boolean;
	accountNickname: string | null;
}

const GroupNicknameRow = (props: RowProps) => {
	const { group, isEditable, accountNickname } = props;
	const inputId = useId();
	const [nickname, setNickname] = useState(group.myNickname ?? '');
	const openModal = useModalStore(state => state.actions.openModal);
	const { mutate: save, isPending } = useUpdateMyNickname(group.groupId);
	const isUnchanged = nickname.trim() === (group.myNickname ?? '');

	const submit = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		save(nickname.trim(), {
			onSuccess: () => openModal({ type: ModalType.ALERT, message: `${getGroupName(group)} 닉네임이 저장되었습니다.` }),
		});
	};

	return (
		<li className="py-3">
			<form onSubmit={submit} className="flex flex-col gap-1.5">
				<label htmlFor={inputId} className="text-sm font-semibold text-gray-900">
					{getGroupName(group)}
				</label>
				<div className="flex gap-2">
					<input
						id={inputId}
						type="text"
						value={nickname}
						maxLength={NICKNAME_MAX}
						disabled={!isEditable}
						placeholder={accountNickname ?? '계정 닉네임'}
						onChange={event => setNickname(event.target.value)}
						className="min-w-0 flex-1 rounded-lg border border-gray-300 px-3 py-2 text-base focus-visible:outline-2 focus-visible:outline-brand-600 disabled:bg-gray-100 disabled:text-gray-500 sm:text-sm"
					/>
					{isEditable && (
						<Button type="submit" variant="secondary" disabled={isPending || isUnchanged}>
							{isPending ? '저장 중…' : '저장'}
						</Button>
					)}
				</div>
				{!isEditable && <p className="text-xs text-gray-500">이 모임은 리더만 닉네임을 바꿀 수 있습니다.</p>}
			</form>
		</li>
	);
};

interface Props {
	groups: readonly MyGroup[] | undefined;
	isError: boolean;
	userKey: number;
	accountNickname: string | null;
}

/** 내 모임별 닉네임 — 비워 두면 계정 닉네임이 보인다 */
export const GroupNicknameList = (props: Props) => {
	const { groups, isError, userKey, accountNickname } = props;
	if (isError) return <EmptyMessage message="모임 목록을 불러오지 못했습니다." />;
	if (!groups) return <EmptyMessage message="로딩 중..." />;
	if (groups.length === 0) return <EmptyMessage message="가입한 모임이 없습니다." />;

	return (
		<ul className="divide-y divide-gray-100">
			{groups.map(group => (
				<GroupNicknameRow
					key={group.groupId}
					group={group}
					isEditable={!!group.allowSelfNickname || group.leaderUserKey === userKey}
					accountNickname={accountNickname}
				/>
			))}
		</ul>
	);
};

import { useId, useState } from 'react';
import type { FormEvent } from 'react';
import { Button } from '@/components/common/atoms/Button';
import { ModalType } from '@/constants';
import { useModalStore } from '@/modules/stores/client/modal';
import { useUpdateAccountNickname } from '@/modules/stores/server/user/mutations';
import type { AccountNickname } from '@/types/Auth';
import type { MyGroup } from '@/types/Group';
import { getGroupName } from '@/utils/group';
import { canEditOwnNickname, NICKNAME_MAX_LENGTH } from '@/utils/member';

const isEditableGroup = (group: MyGroup): boolean =>
	canEditOwnNickname({ allowSelfNickname: group.allowSelfNickname, role: group.myRole });

/** 처음에는 계정 이름을 그대로 쓰던(바꿀 수 있는) 모임을 골라 둔다 — 이름을 따로 정한 모임은 그대로 둔다 */
const getDefaultGroupIds = (groups: readonly MyGroup[], accountNickname: string | null): Set<number> =>
	new Set(
		groups.filter(group => isEditableGroup(group) && group.myNickname === accountNickname).map(group => group.groupId),
	);

const buildResultMessage = (result: AccountNickname, groups: readonly MyGroup[]): string => {
	const nameOf = (groupId: number): string => {
		const group = groups.find(item => item.groupId === groupId);
		return group ? getGroupName(group) : `모임 #${groupId}`;
	};
	const lines = ['닉네임이 저장되었습니다.'];
	if (result.updated.length > 0) lines.push(`모임 ${result.updated.length}곳의 닉네임도 바꿨습니다.`);
	result.skipped.forEach(row => lines.push(`${nameOf(row.groupId)}: ${row.message}`));
	return lines.join('\n');
};

interface Props {
	nickname: string | null;
	/** 내 모임 — 계정 닉네임을 바꿀 때 같은 이름으로 바꿀 모임을 고른다 */
	groups: readonly MyGroup[];
}

/** 계정 닉네임(계정당 하나) — 모임 닉네임은 모임마다 따로라, 같이 바꿀 모임을 체크한다 */
export const AccountNicknameForm = (props: Props) => {
	const { groups } = props;
	const inputId = useId();
	const helpId = useId();
	const [nickname, setNickname] = useState(props.nickname ?? '');
	const [checkedIds, setCheckedIds] = useState<Set<number> | null>(null);
	const openModal = useModalStore(state => state.actions.openModal);
	const { mutate: save, isPending } = useUpdateAccountNickname();
	const trimmed = nickname.trim();
	const canSave = trimmed.length > 0 && trimmed !== (props.nickname ?? '');
	// 사용자가 아직 고르지 않았으면 기본 선택을 따른다(모임 목록이 늦게 와도 맞도록 상태로 굳히지 않는다)
	const selectedIds = checkedIds ?? getDefaultGroupIds(groups, props.nickname);

	const toggle = (groupId: number, checked: boolean) => {
		const next = new Set(selectedIds);
		if (checked) next.add(groupId);
		else next.delete(groupId);
		setCheckedIds(next);
	};

	const submit = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		if (!canSave) return;
		const groupIds = groups
			.filter(group => isEditableGroup(group) && selectedIds.has(group.groupId))
			.map(group => group.groupId);
		save(
			{ nickname: trimmed, groupIds },
			{
				onSuccess: result => {
					setCheckedIds(null);
					openModal({ type: ModalType.ALERT, message: buildResultMessage(result, groups) });
				},
			},
		);
	};

	return (
		<form onSubmit={submit} className="flex flex-col gap-1.5">
			<label htmlFor={inputId} className="text-sm font-medium text-gray-800">
				계정 닉네임
			</label>
			<div className="flex gap-2">
				<input
					id={inputId}
					type="text"
					value={nickname}
					maxLength={NICKNAME_MAX_LENGTH}
					aria-describedby={helpId}
					autoComplete="nickname"
					onChange={event => setNickname(event.target.value)}
					className="min-w-0 flex-1 rounded-lg border border-gray-300 px-3 py-2 text-base focus-visible:outline-2 focus-visible:outline-brand-600 sm:text-sm"
				/>
				<Button type="submit" disabled={isPending || !canSave}>
					{isPending ? '저장 중…' : '저장'}
				</Button>
			</div>
			<p id={helpId} className="text-xs text-gray-500">
				계정에 하나뿐인 이름입니다(최대 {NICKNAME_MAX_LENGTH}자). 모임에서 보이는 이름은 모임마다 따로 관리됩니다.
			</p>
			{canSave && groups.length > 0 && (
				<div className="mt-2 rounded-xl bg-gray-50 p-3">
					<fieldset>
						<legend className="text-sm font-medium text-gray-800">모임 닉네임도 “{trimmed}”(으)로 바꾸기</legend>
						<ul className="mt-2 flex flex-col gap-2">
							{groups.map(group => {
								const isEditable = isEditableGroup(group);
								return (
									<li key={group.groupId}>
										<label className="flex items-start gap-2 text-sm text-gray-800">
											<input
												type="checkbox"
												className="mt-1"
												disabled={!isEditable}
												checked={isEditable && selectedIds.has(group.groupId)}
												onChange={event => toggle(group.groupId, event.target.checked)}
											/>
											<span className={isEditable ? undefined : 'text-gray-400'}>
												{getGroupName(group)}
												<span className="block text-xs text-gray-500">
													{isEditable
														? `지금: ${group.myNickname ?? '-'}`
														: '모임장이 관리하는 모임이라 바꿀 수 없어요'}
												</span>
											</span>
										</label>
									</li>
								);
							})}
						</ul>
					</fieldset>
				</div>
			)}
		</form>
	);
};

import { useId, useState } from 'react';
import type { FormEvent } from 'react';
import { Button } from '@/components/common/atoms/Button';
import { useUpdateMemberNickname, useUpdateMyNickname } from '@/modules/stores/server/member/mutations';

// 백엔드 group_member.nickname VARCHAR(30)
const NICKNAME_MAX = 30;

interface Props {
	groupId: number;
	/** 모임장·매니저가 다른 회원의 이름을 바꿀 때 그 회원. 없으면 내 닉네임 */
	userKey?: number;
	/** 지금 이 모임에서 쓰는 닉네임(없으면 null) */
	groupNickname: string | null;
	onSaved: () => void;
}

/** 모임 닉네임 — 비우고 저장하면 그 사람의 계정 닉네임으로 맞춘다 */
export const GroupNicknameForm = (props: Props) => {
	const { groupId, userKey, groupNickname, onSaved } = props;
	const inputId = useId();
	const helpId = useId();
	const [nickname, setNickname] = useState(groupNickname ?? '');
	const saveMine = useUpdateMyNickname(groupId);
	const saveMember = useUpdateMemberNickname(groupId);
	const isPending = saveMine.isPending || saveMember.isPending;
	const isUnchanged = nickname.trim() === (groupNickname ?? '');

	const submit = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		if (userKey === undefined) saveMine.mutate(nickname.trim(), { onSuccess: onSaved });
		else saveMember.mutate({ userKey, nickname: nickname.trim() }, { onSuccess: onSaved });
	};

	return (
		<form onSubmit={submit} className="flex flex-col gap-1">
			<label htmlFor={inputId} className="text-sm font-medium text-gray-800">
				모임 닉네임
			</label>
			<div className="flex gap-2">
				<input
					id={inputId}
					type="text"
					value={nickname}
					maxLength={NICKNAME_MAX}
					aria-describedby={helpId}
					onChange={event => setNickname(event.target.value)}
					className="min-w-0 flex-1 rounded-md border border-gray-300 px-3 py-2 text-base focus-visible:outline-2 focus-visible:outline-brand-600 sm:text-sm"
				/>
				<Button type="submit" disabled={isPending || isUnchanged}>
					{isPending ? '저장 중…' : '저장'}
				</Button>
			</div>
			<p id={helpId} className="text-xs text-gray-500">
				이 모임에서만 보이는 이름입니다. 비우고 저장하면 계정 닉네임으로 맞춥니다.
			</p>
		</form>
	);
};

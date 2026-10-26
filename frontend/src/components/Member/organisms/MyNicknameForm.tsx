import { useId, useState } from 'react';
import type { FormEvent } from 'react';
import { Button } from '@/components/common/atoms/Button';
import { useUpdateMyNickname } from '@/modules/stores/server/member/mutations';

// 백엔드 group_member.nickname VARCHAR(30)
const NICKNAME_MAX = 30;

interface Props {
	groupId: number;
	/** 지금 이 모임에서 쓰는 닉네임(없으면 null) */
	groupNickname: string | null;
	onSaved: () => void;
}

/** 내 모임 닉네임 — 비우고 저장하면 계정 닉네임으로 돌아간다 */
export const MyNicknameForm = (props: Props) => {
	const { groupId, groupNickname, onSaved } = props;
	const inputId = useId();
	const helpId = useId();
	const [nickname, setNickname] = useState(groupNickname ?? '');
	const { mutate: save, isPending } = useUpdateMyNickname(groupId);
	const isUnchanged = nickname.trim() === (groupNickname ?? '');

	const submit = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		save(nickname.trim(), { onSuccess: onSaved });
	};

	return (
		<form onSubmit={submit} className="mt-4 flex flex-col gap-1 border-t border-gray-100 pt-3">
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
					className="min-w-0 flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-gray-900"
				/>
				<Button type="submit" disabled={isPending || isUnchanged}>
					{isPending ? '저장 중…' : '저장'}
				</Button>
			</div>
			<p id={helpId} className="text-xs text-gray-500">
				이 모임에서만 보이는 이름입니다. 비우면 계정 닉네임을 씁니다.
			</p>
		</form>
	);
};

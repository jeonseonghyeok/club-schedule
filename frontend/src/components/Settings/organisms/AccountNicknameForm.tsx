import { useId, useState } from 'react';
import type { FormEvent } from 'react';
import { Button } from '@/components/common/atoms/Button';
import { ModalType } from '@/constants';
import { useModalStore } from '@/modules/stores/client/modal';
import { useUpdateAccountNickname } from '@/modules/stores/server/user/mutations';

// 백엔드 PATCH /api/users/me 검증과 같은 제한
const NICKNAME_MAX = 30;

interface Props {
	nickname: string | null;
}

/** 계정 닉네임 — 모임 닉네임을 정하지 않은 모임에서는 이 이름이 보인다 */
export const AccountNicknameForm = (props: Props) => {
	const inputId = useId();
	const helpId = useId();
	const [nickname, setNickname] = useState(props.nickname ?? '');
	const openModal = useModalStore(state => state.actions.openModal);
	const { mutate: save, isPending } = useUpdateAccountNickname();
	const trimmed = nickname.trim();
	const canSave = trimmed.length > 0 && trimmed !== (props.nickname ?? '');

	const submit = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		if (!canSave) return;
		save(trimmed, { onSuccess: () => openModal({ type: ModalType.ALERT, message: '닉네임이 저장되었습니다.' }) });
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
					maxLength={NICKNAME_MAX}
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
				모임 닉네임을 따로 정하지 않은 모임에서는 이 이름이 보입니다.
			</p>
		</form>
	);
};

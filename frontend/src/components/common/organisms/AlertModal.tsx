import { useEffect, useId, useRef } from 'react';

interface Props {
	message: string;
	onClose: () => void;
}

// 네이티브 <dialog>.showModal() 이 포커스 가두기·Esc 닫기·배경 비활성화를 처리한다.
export const AlertModal = (props: Props) => {
	const { message, onClose } = props;
	const dialogRef = useRef<HTMLDialogElement>(null);
	const messageId = useId();

	useEffect(() => {
		const dialog = dialogRef.current;
		if (!dialog || dialog.open) return;
		dialog.showModal();
		return () => dialog.close();
	}, []);

	return (
		<dialog
			ref={dialogRef}
			aria-describedby={messageId}
			onClose={onClose}
			className="m-auto w-80 rounded-lg p-6 shadow-xl backdrop:bg-black/40"
		>
			<p id={messageId} className="text-gray-900">
				{message}
			</p>
			<div className="mt-6 flex justify-end">
				<button
					type="button"
					onClick={() => dialogRef.current?.close()}
					autoFocus
					className="rounded-md bg-gray-900 px-4 py-2 text-sm text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900"
				>
					확인
				</button>
			</div>
		</dialog>
	);
};

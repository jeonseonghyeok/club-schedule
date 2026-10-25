import { useEffect, useId, useRef } from 'react';
import type { ReactNode, SyntheticEvent } from 'react';
import { cn } from '@/utils';

export const DIALOG_SIZE = { SM: 'sm', MD: 'md' } as const;
export type DialogSize = (typeof DIALOG_SIZE)[keyof typeof DIALOG_SIZE];

const SIZE_CLASS = { sm: 'w-80', md: 'w-[min(32rem,calc(100vw-2rem))]' } as const satisfies Record<DialogSize, string>;

interface Props {
	/** 제목이 없는 알림·확인 모달은 descriptionId 로 메시지 요소를 가리킨다 */
	title?: string;
	descriptionId?: string;
	size?: DialogSize;
	/** false 면 Esc·닫기 버튼으로 닫을 수 없다(로그인 필요 안내 등) */
	dismissible?: boolean;
	onClose: () => void;
	headerActions?: ReactNode;
	children: ReactNode;
}

// 네이티브 <dialog>.showModal() 이 포커스 가두기·배경 비활성화·최상위 레이어(중첩 모달)를 처리한다.
export const Dialog = (props: Props) => {
	const { title, descriptionId, size = DIALOG_SIZE.SM, dismissible = true, onClose, headerActions, children } = props;
	const dialogRef = useRef<HTMLDialogElement>(null);
	const titleId = useId();

	// 최신 onClose 를 참조하되 리스너는 한 번만 등록한다
	const onCloseRef = useRef(onClose);
	useEffect(() => {
		onCloseRef.current = onClose;
	});

	useEffect(() => {
		const dialog = dialogRef.current;
		if (!dialog) return;
		const handleClose = () => onCloseRef.current();
		dialog.addEventListener('close', handleClose);
		if (!dialog.open) dialog.showModal();
		// 부모가 언마운트시킬 때는 onClose 를 다시 부르지 않도록 리스너를 먼저 뗀다
		return () => {
			dialog.removeEventListener('close', handleClose);
			if (dialog.open) dialog.close();
		};
	}, []);

	const preventDismiss = (event: SyntheticEvent<HTMLDialogElement>) => {
		if (!dismissible) event.preventDefault();
	};

	return (
		<dialog
			ref={dialogRef}
			aria-labelledby={title ? titleId : undefined}
			aria-describedby={descriptionId}
			onCancel={preventDismiss}
			className={cn('m-auto max-h-[85vh] rounded-xl p-0 shadow-xl backdrop:bg-black/40', SIZE_CLASS[size])}
		>
			{title && (
				<header className="flex items-center justify-between gap-2 border-b border-gray-100 px-6 py-4">
					<h2 id={titleId} className="text-lg font-bold text-gray-900">
						{title}
					</h2>
					<div className="flex items-center gap-2">
						{headerActions}
						{dismissible && (
							<button
								type="button"
								aria-label="닫기"
								onClick={() => dialogRef.current?.close()}
								className="rounded-md px-2 py-1 text-gray-500 hover:bg-gray-100 focus-visible:outline-2 focus-visible:outline-gray-900"
							>
								✕
							</button>
						)}
					</div>
				</header>
			)}
			<div className="overflow-y-auto px-6 py-5">{children}</div>
		</dialog>
	);
};

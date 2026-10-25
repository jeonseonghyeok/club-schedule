import { useId } from 'react';
import { Button } from '@/components/common/atoms/Button';
import { Dialog } from '@/components/common/organisms/Dialog';

interface Props {
	message: string;
	confirmLabel: string;
	onConfirm: () => void;
	onClose: () => void;
}

export const ConfirmModal = (props: Props) => {
	const messageId = useId();
	const { message, confirmLabel, onConfirm, onClose } = props;

	const confirm = () => {
		onClose();
		onConfirm();
	};

	return (
		<Dialog descriptionId={messageId} onClose={onClose}>
			<p id={messageId} className="text-gray-900">
				{message}
			</p>
			<div className="mt-6 flex justify-end gap-2">
				<Button variant="secondary" autoFocus onClick={onClose}>
					취소
				</Button>
				<Button onClick={confirm}>{confirmLabel}</Button>
			</div>
		</Dialog>
	);
};

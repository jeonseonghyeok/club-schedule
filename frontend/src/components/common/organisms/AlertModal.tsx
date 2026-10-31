import { useId } from 'react';
import { Button } from '@/components/common/atoms/Button';
import { Dialog } from '@/components/common/organisms/Dialog';

interface Props {
	message: string;
	onClose: () => void;
}

export const AlertModal = (props: Props) => {
	const messageId = useId();
	const { message, onClose } = props;

	return (
		<Dialog descriptionId={messageId} onClose={onClose}>
			<p id={messageId} className="whitespace-pre-line text-gray-900">
				{message}
			</p>
			<div className="mt-6 flex justify-end">
				<Button autoFocus onClick={onClose}>
					확인
				</Button>
			</div>
		</Dialog>
	);
};

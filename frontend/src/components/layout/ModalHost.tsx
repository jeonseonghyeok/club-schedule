import { AlertModal } from '@/components/common/organisms/AlertModal';
import { ConfirmModal } from '@/components/common/organisms/ConfirmModal';
import { ModalType } from '@/constants';
import { useModalStore } from '@/modules/stores/client/modal';

export const ModalHost = () => {
	const modal = useModalStore(state => state.modal);
	const { closeModal } = useModalStore(state => state.actions);

	if (!modal) return null;

	switch (modal.type) {
		case ModalType.ALERT:
			return <AlertModal message={modal.message} onClose={closeModal} />;
		case ModalType.CONFIRM:
			return (
				<ConfirmModal
					message={modal.message}
					confirmLabel={modal.confirmLabel}
					onConfirm={modal.onConfirm}
					onClose={closeModal}
				/>
			);
		default: {
			const exhaustive: never = modal;
			return exhaustive;
		}
	}
};

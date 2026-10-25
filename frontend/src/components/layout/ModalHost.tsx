import { AlertModal } from '@/components/common/organisms/AlertModal';
import { ModalType } from '@/constants';
import { useModalStore } from '@/modules/stores/client/modal';

export const ModalHost = () => {
	const modal = useModalStore(state => state.modal);
	const { closeModal } = useModalStore(state => state.actions);

	if (!modal) return null;

	switch (modal.type) {
		case ModalType.ALERT:
			return <AlertModal message={modal.message} onClose={closeModal} />;
		default: {
			const exhaustive: never = modal.type;
			return exhaustive;
		}
	}
};

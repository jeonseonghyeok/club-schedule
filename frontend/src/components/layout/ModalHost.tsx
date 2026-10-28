import { LoginPromptDialog } from '@/components/Auth/organisms/LoginPromptDialog';
import { AlertModal } from '@/components/common/organisms/AlertModal';
import { ConfirmModal } from '@/components/common/organisms/ConfirmModal';
import { ReasonDialog } from '@/components/common/organisms/ReasonDialog';
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
		case ModalType.REASON:
			return (
				<ReasonDialog
					title={modal.title}
					reasonLabel={modal.reasonLabel}
					confirmLabel={modal.confirmLabel}
					isReasonRequired
					isSubmitting={false}
					onSubmit={reason => {
						closeModal();
						modal.onSubmit(reason);
					}}
					onClose={closeModal}
				/>
			);
		case ModalType.LOGIN:
			return <LoginPromptDialog message={modal.message} onClose={closeModal} />;
		default: {
			const exhaustive: never = modal;
			return exhaustive;
		}
	}
};

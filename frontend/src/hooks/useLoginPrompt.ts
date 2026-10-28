import { ModalType } from '@/constants';
import { useModalStore } from '@/modules/stores/client/modal';

const DEFAULT_MESSAGE = '로그인하면 모임에 가입하고 일정에 참가할 수 있어요.';

/** 로그인이 필요한 동작에서 부른다 — 강제하지 않고, 닫으면 보던 화면에 그대로 있다 */
export const useLoginPrompt = (): ((message?: string) => void) => {
	const openModal = useModalStore(state => state.actions.openModal);
	return (message = DEFAULT_MESSAGE) => openModal({ type: ModalType.LOGIN, message });
};

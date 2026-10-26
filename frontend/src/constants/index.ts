export const ModalType = { ALERT: 'ALERT', CONFIRM: 'CONFIRM', REASON: 'REASON' } as const;
export type ModalType = (typeof ModalType)[keyof typeof ModalType];

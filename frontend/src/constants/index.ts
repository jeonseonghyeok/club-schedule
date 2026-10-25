export const ModalType = { ALERT: 'ALERT', CONFIRM: 'CONFIRM' } as const;
export type ModalType = (typeof ModalType)[keyof typeof ModalType];

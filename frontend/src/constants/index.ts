export const ModalType = { ALERT: 'ALERT' } as const;
export type ModalType = (typeof ModalType)[keyof typeof ModalType];
